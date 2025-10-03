// Types
import type * as Types from "@shared/types";

// Children
import Route from "./route";

export default class WaveManager {
	public enemyDefs: Types.Core.Map.EnemyTemplate[] = [];
	public pendingKillGrants = new Map<string, number>();
	public emissions: Types.Core.Wave.Emission[] = [];
	public spawningComplete = false;
	public pendingReward?: number;
	public waveActive = false;
	public enemiesAlive = 0;
	public activeWave = -1;
	public spawnCursor = 0;

	public waveTime = 0;
	public gameSpeed = 1;

	// Routes

	public route: Route;
	public routes: Types.Core.Route.Info[] = [];

	constructor(
		public mission: Types.Core.Map.Mission | undefined,
		public ctx: Types.Core.Systems.Context,
		private coreDebugGetter: () => boolean,
	) {
		this.route = new Route(
			{
				grid: {
					width: 16,
					height: 9,
					tileSize: 1,
				},
			},
			() => this.debug(),
		);
	}

	private debug() {
		return this.coreDebugGetter?.() ?? false;
	}

	// --- ROUTES ---

	public loadRoutes() {
		this.routes = this.route.buildRoutesFromWorld();
		if (this.debug()) print(`[WaveManager] Loaded ${this.routes.size()} routes`);
	}

	// --- WAVES ---

	public startMission(mission: Types.Core.Map.Mission, defs: Types.Core.Map.EnemyTemplate[]) {
		this.mission = mission;
		this.enemyDefs = defs ?? [];
		this.activeWave = -1;
		this.waveActive = false;
		this.waveTime = 0;
		this.emissions = [];
		this.spawnCursor = 0;
		this.spawningComplete = false;
	}

	public startNextWave(): boolean {
		if (!this.mission) return false;

		const nextIndex = this.activeWave + 1;
		const wave = this.mission.waves[nextIndex];
		if (!wave) return false;

		this.activeWave = nextIndex;
		this.spawnCursor = 0;
		this.waveActive = true;
		this.spawningComplete = false;
		this.waveTime = 0;
		this.buildEmissions(wave);

		if (this.debug()) print(`[WaveManager] Wave ${nextIndex} started`);

		return true;
	}

	private buildEmissions(w: Types.Core.Map.Wave) {
		const evts: Types.Core.Wave.Emission[] = [];
		for (let gi = 0; gi < (w.spawns?.size() ?? 0); gi++) {
			const s = w.spawns[gi];
			const count = s?.count ?? 1;
			const interval = s?.interval ?? 0.25;

			for (let k = 0; k < count; k++) {
				evts.push({
					time: (s?.at ?? 0) + k * interval,
					enemy: s?.enemy ?? "unknown",
					routeIndex: s?.routeIndex ?? 1,
					boss: s?.boss ?? false,
				});
			}
		}

		evts.sort((a, b) => (a.time ?? 0) < (b.time ?? 0));
		this.emissions = evts;
		this.spawnCursor = 0;

		if (this.debug()) print(`[WaveManager] Built ${evts.size()} emissions`);
	}

	public tick(dt: number) {
		if (!this.waveActive) return;

		const effectiveDt = dt * math.clamp(this.gameSpeed, 0, 3);
		this.waveTime += effectiveDt;

		// --- Spawn enemies ---
		while (this.spawnCursor < this.emissions.size()) {
			const em = this.emissions[this.spawnCursor];
			if ((em?.time ?? math.huge) > this.waveTime) break;

			const def = this.enemyDefs.find((e) => e.id === (em?.enemy ?? ""));
			if (def) this.spawnEmission(em, def);

			this.spawnCursor += 1;
		}

		if (!this.spawningComplete && this.spawnCursor >= this.emissions.size()) {
			this.spawningComplete = true;
			if (this.debug()) print(`[WaveManager] Wave ${this.activeWave} spawning complete`);
		}

		// --- Move enemies along routes ---
		this.moveEnemiesAlongPath(effectiveDt);
	}

	private spawnEmission(em: Types.Core.Wave.Emission, def: Types.Core.Map.EnemyTemplate) {
		const route = this.routes[em.routeIndex - 1];
		if (!route || route.path.size() < 2) return;

		const path = route.path;
		const e = this.ctx.world.entity();
		const C = this.ctx.C;

		this.ctx.world.add(e, C.Tags.Enemy);
		this.ctx.world.set(e, C.Enemy.MaxHealth, def.health ?? 1);
		this.ctx.world.set(e, C.Enemy.Health, def.health ?? 1);
		this.ctx.world.set(e, C.Enemy.Speed, def.speed ?? 1);

		const sh = math.max(0, math.floor(def.shield ?? 0));
		this.ctx.world.set(e, C.Enemy.Shield, sh);
		this.ctx.world.set(e, C.Enemy.MaxShield, sh);

		this.ctx.world.set(e, C.Enemy.ShieldMultiplier, def.shieldMultiplier ?? 1);
		this.ctx.world.set(e, C.Enemy.Bounty, def.bounty ?? 0);

		if (def.boss || em.boss) this.ctx.world.add(e, C.Tags.Boss);

		this.ctx.world.set(e, C.Enemy.Id, em.enemy ?? "unknown");
		this.ctx.world.set(e, C.Grid.PathIndex, em.routeIndex - 1 ?? 0);
		this.ctx.world.set(e, C.Grid.PathProgress, { node: 0, progress: 0 });
		this.ctx.world.set(e, C.Grid.SpawnPoint, path[0]);
		this.ctx.world.set(e, C.Grid.Grid, path[0]);
		this.ctx.world.set(e, C.Grid.World, path[0]);

		const delta = path[1].sub(path[0]);
		if (delta.Magnitude > 1e-6) this.ctx.world.set(e, C.Grid.Orientation, math.atan2(delta.Y, delta.X));

		this.enemiesAlive += 1;
		if (this.debug()) print(`[WaveManager] Spawned enemy ${em.enemy ?? "unknown"} on route ${em.routeIndex}`);
	}

	private moveEnemiesAlongPath(dt: number) {
		const C = this.ctx.C;

		for (const [e] of this.ctx.world.query().with(C.Tags.Enemy)) {
			const progressData = this.ctx.world.get(e, C.Grid.PathProgress)!;
			let index = progressData.node;
			let progress = progressData.progress;
			const speed = this.ctx.world.get(e, C.Enemy.Speed)!;

			const route = this.routes[this.ctx.world.get(e, C.Grid.PathIndex)!];
			if (!route || route.path.size() < 2 || index >= route.path.size() - 1) continue;

			const current = route.path[index];

			const nextPoint = route.path[index + 1];
			const direction = nextPoint.sub(current);
			const dist = direction.Magnitude;
			if (dist <= 0) continue;

			let deltaProgress = (speed * dt) / dist;
			progress += deltaProgress;

			while (progress >= 1 && index < route.path.size() - 1) {
				progress -= 1;
				index += 1;
			}

			const newPos = current.add(direction.mul(progress));
			this.ctx.world.set(e, C.Grid.Grid, newPos);
			this.ctx.world.set(e, C.Grid.World, newPos);
			this.ctx.world.set(e, C.Grid.PathProgress, { node: index, progress });

			if (direction.Magnitude > 1e-6)
				this.ctx.world.set(e, C.Grid.Orientation, math.atan2(direction.Y, direction.X));

			// Enemy reached end
			if (index >= route.path.size() - 1 && progress >= 1) {
				this.enemiesAlive -= 1;
				this.ctx.world.delete(e);
			}
		}
	}

	public completeWave() {
		if (this.debug()) print(`[WaveManager] Completing wave ${this.activeWave}`);
		this.waveActive = false;
		this.spawnCursor = 0;
		this.enemiesAlive = 0;
		this.spawningComplete = true;
		this.waveTime = 0;
	}

	public setGameSpeed(mult: number) {
		this.gameSpeed = math.clamp(mult, 0, 3);
	}
}

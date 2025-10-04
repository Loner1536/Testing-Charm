// Services
import { RunService, ServerStorage, Workspace } from "@rbxts/services";

// Packages
import Network from "@shared/network";

// Types
import type * as Types from "@shared/types";

// Configurations
import mapConfiguration, { typeConfiguration } from "@shared/configurations/maps";

// Components
import Route from "./route";

export default class WaveSystem {
	public enemyDefs: Types.Core.Map.EnemyTemplate[] = [];
	public pendingKillGrants = new Map<string, number>();
	public emissions: Types.Core.Wave.Emission[] = [];
	public spawningComplete = false;
	public pendingReward?: number;
	public waveActive = false;
	public enemiesAlive = 0;
	public activeWave = 0;
	public spawnCursor = 0;

	public waveTime = 0;
	public gameSpeed = 3;

	public path?: Vector3[];
	public routes: Types.Core.Route.Info[] = [];

	public spawnerId?: number;

	public activeSpawns: Types.Core.Wave.activeSpawn[] = [];
	public votes: Map<string, boolean> = new Map();
	public hpStocks = 3;

	private ServerNetwork() {
		if (RunService.IsClient()) return;

		Network.server.on(Network.keys.wave.vote, (player) => {
			this.sim.S.Network.Wave.Vote(player);
		});

		Network.server.on(Network.keys.wave.gameSpeed, (_, speed) => {
			this.sim.S.Network.Wave.GameSpeed(speed);
		});
	}

	constructor(
		private sim: Types.Core.API,
		public mission?: Types.Core.Map.Mission | undefined,
	) {
		this.spawnerId = sim.P?.ensureSystem("ecs.spawn", "update");

		this.ServerNetwork();
	}

	public tick(dt: number) {
		if (!this.activeSpawns || !this.routes) return;

		for (const batch of this.activeSpawns) {
			batch.timer -= dt;
			if (batch.timer <= 0 && batch.remaining > 0) {
				const route = this.routes[batch.spawnConfig.routeIndex ?? 0];
				if (!route) continue;

				const startNode = route.path[0];
				const enemyDef = this.enemyDefs.find((e) => e.id === batch.spawnConfig.enemy);
				if (!enemyDef) continue;

				print(`[WaveSystem] Spawning enemy "${enemyDef.id}" at route "${route.name}"`);

				const e = this.sim.world.entity();
				this.sim.world.add(e, this.sim.C.Tags.Enemy);
				this.sim.world.set(e, this.sim.C.Enemy.MaxHealth, enemyDef.health);
				this.sim.world.set(e, this.sim.C.Enemy.Health, enemyDef.health);
				this.sim.world.set(e, this.sim.C.Enemy.Speed, enemyDef.speed);
				this.sim.world.set(e, this.sim.C.Enemy.PathProgress, { node: 0, progress: 0 });
				this.sim.world.set(e, this.sim.C.Vectors.Grid, new Vector2(startNode.X, startNode.Y));
				this.sim.world.set(e, this.sim.C.Vectors.World, startNode);

				// this.sim.S.Enemy.updateSimpleOrientation(e, 0, route.path);

				batch.remaining -= 1;
				batch.timer = math.max(0, batch.spawnConfig.interval);
				this.enemiesAlive += 1;

				if (this.sim.debug) {
					const debugFolder = Workspace.FindFirstChild("Debug") as Folder;

					const debugBox = new Instance("Part");
					debugBox.Name = `EnemyDebug-${e}`;
					debugBox.Color = new Color3(1, 0, 0);
					debugBox.Size = new Vector3(1, 1, 1);
					debugBox.CanCollide = false;
					debugBox.Anchored = true;

					debugBox.Position = startNode;

					debugBox.Parent = debugFolder;

					this.sim.world.set(e, this.sim.C.Debug.Visual, debugBox);
				}
			}
		}
	}

	public prepareWave(waveIndex: number) {
		const wave = this.mission?.waves[waveIndex];
		if (!wave) return;

		this.activeSpawns = wave.spawns.map((spawn) => ({
			spawnConfig: spawn,
			timer: spawn.at,
			remaining: spawn.count ?? 1,
		}));
	}
	public startMission() {
		if (!this.mission || this.enemyDefs) return;

		this.waveActive = false;
		this.enemiesAlive = 0;
		this.spawnCursor = 0;
		this.emissions = [];
		this.waveTime = 0;
	}
	public nextWave() {
		if (!this.mission) return;

		this.prepareWave(this.activeWave);

		this.sim.StateManager.waveData.update((data) => {
			this.activeWave += 1;
			data.wave += 1;
			print(`[WaveSystem] Starting wave ${this.activeWave}`);

			return data;
		});
	}

	private loadRoutes() {
		const route = new Route(this.sim, {
			grid: {
				width: 16,
				height: 9,
				tileSize: 1,
			},
		});

		this.routes = route.buildRoutesFromWorld();

		const validRoutes = this.routes.filter((r) => route.validateRoute(r));

		if (validRoutes.size() === 0)
			error("No valid routes found for Map. Ensure all routes are under Routes folder in Map.");

		this.path = validRoutes[0].path;

		if (this.sim.debug) print(`Using route "${validRoutes[0].name}" with ${this.path.size()} waypoints`);
		if (this.sim.debug)
			print(
				"Route path:",
				this.path.map((p) => `(${p.X},${p.Y})`),
			);

		if (this.sim.debug) print(`[WaveSystem] Loaded ${this.routes.size()} routes`);
	}
	public loadMap(teleportData: Types.Core.Party.TeleportData) {
		if (RunService.IsClient() && RunService.IsRunning()) return;

		if (RunService.IsRunning()) {
			const models = ServerStorage.FindFirstChild("assets")?.FindFirstChild("models") as Folder;
			assert(models, "[WaveSystem] ServerStorage/models folder not found");

			const maps = models.FindFirstChild("maps") as Folder;
			assert(maps, "[WaveSystem] ServerStorage/models/maps folder not found");

			const map = maps?.FindFirstChild(teleportData.id) as Model;

			if (!map) {
				warn(`[WaveSystem] Map with id "${teleportData.id}" not found in ServerStorage/models/maps`);
				return;
			}

			map.Name = "Map";
			map.Parent = Workspace;

			if (map) this.loadRoutes();
		}

		this.hpStocks = typeConfiguration[teleportData.type].maxStocks;

		const mission = mapConfiguration[teleportData.type][teleportData.id as never] as Types.Core.Map.Mission;

		if (mission) this.mission = mission;
		if (mission && mission.enemies) this.enemyDefs = mission.enemies;

		this.sim.StateManager.waveData.update((data) => {
			print("1");
			data.id = teleportData.id;
			data.type = teleportData.type;

			data.hpStocks = this.hpStocks;
			data.vote = true;

			return data;
		});
	}
}

// Packages
import { world, type World } from "@rbxts/jecs";
import Signal from "@rbxts/lemon-signal";

// Types
import type * as Types from "@shared/types";

// Components
import Components from "../components";
import JabbyProfiler from "./jabby";
import Systems from "../systems";
import Grid from "./grid";

// Children
import WaveManager from "./managers/waveManager";

export default class Core {
	public world: World;
	public grid: Grid;
	public C: Components;
	public P: JabbyProfiler;
	public S: Systems;

	public ctx: Types.Core.Ctx;

	public waveManager: WaveManager;

	public onWaveSpawningComplete = new Signal<() => void>();
	public onTickComplete = new Signal<(dt: number) => void>();

	private simTime = 0;

	public debug = true;

	constructor(mission?: Types.Core.Map.Mission, enemyDefs?: Types.Core.Map.EnemyTemplate[]) {
		this.world = world();
		this.grid = new Grid({ width: 16, height: 9, tileSize: 1 });
		this.C = new Components(this.world);
		this.P = new JabbyProfiler();
		this.S = new Systems();

		this.ctx = { world: this.world, C: this.C, path: [] as Vector2[] };

		this.waveManager = new WaveManager(mission, this.ctx, () => this.debug);

		if (mission && enemyDefs) this.waveManager.startMission(mission, enemyDefs);
	}

	public tick(dt: number) {
		const effectiveDt = dt * math.clamp(this.waveManager.gameSpeed, 0, 3);
		this.simTime += effectiveDt;

		this.waveManager.tick(dt);

		const idMove = this.P.ensureSystem("ecs.moveEnemies", "update");
		const idTower = this.P.ensureSystem("ecs.towersAttack", "update");
		const idReconcile = this.P.ensureSystem("ecs.reconcilePredicted", "update");

		this.P.run(idMove, () => this.S.Enemy.move(this.waveManager.ctx, effectiveDt));
		this.P.run(idTower, () => this.S.Tower.attack(this.waveManager.ctx, effectiveDt));
		this.P.run(idReconcile, () => this.S.Enemy.reconcilePredicted(this.world, this.C));

		this.onTickComplete.Fire(dt);
	}
}

// Services
import { RunService } from "@rbxts/services";

// Packages
import { world, type World } from "@rbxts/jecs";

// Types
import * as Types from "@shared/types";

// Utility
import safePlayerAdded from "@shared/utility/safePlayerAdded";

// Components
import StateManager from "@shared/stateManager";
import Components from "../components";
import JabbyProfiler from "./jabby";
import Systems from "../systems";
import Utility from "../utility";
import Grid from "./grid";

export default class Core {
	public world: World;
	public grid: Grid;

	public P: JabbyProfiler;
	public C: Components;
	public U: Utility;
	public S: Systems;

	public StateManager = new StateManager();

	public party = new Map<string, Types.Core.Party.Host | Types.Core.Party.Member>();

	private simTime = 0;

	public debug = true;

	private initPlayerAdd() {
		safePlayerAdded((player) => {
			if (this.party.get(tostring(player))) return;

			if (this.party.size() === 0) {
				const joinData = player.GetJoinData();

				switch (RunService.IsStudio()) {
					case true: {
						this.party.set(tostring(player.UserId), {
							type: "host",
							data: {
								id: "SandVillage",
								difficulty: "normal",
								type: "story",
							},
						});
						break;
					}
					case false: {
						const teleportData = joinData.TeleportData as Types.Core.Party.TeleportData | undefined;

						if (teleportData) {
							this.party.set(tostring(player.UserId), {
								type: "host",
								data: teleportData,
							});
						} else error("failed to retrieve teleport data from host");
						break;
					}
				}

				if (RunService.IsServer()) {
					const playerData = this.party.get(tostring(player.UserId)) as Types.Core.Party.Host;
					if (!playerData) return;

					this.S.Wave.loadMap(playerData.data);
				}
			} else {
				this.party.set(tostring(player.UserId), {
					type: "member",
				});
			}
		});
	}

	constructor() {
		this.world = world();
		this.grid = new Grid({ width: 16, height: 9, tileSize: 1 });

		this.C = new Components(this);
		this.P = new JabbyProfiler();
		this.U = new Utility(this);
		this.S = new Systems(this);

		if (!RunService.IsRunning()) {
			this.S.Wave.loadMap({
				id: "SandVillage",
				difficulty: "normal",
				type: "story",
			});
			return;
		}

		this.initPlayerAdd();

		this.U.Scheduler.system((...args) => {
			const dt = args[0] as number;
			return this.tick(dt);
		});
	}

	public tick(dt: number) {
		const effectiveDt = dt * math.clamp(this.S.Wave.gameSpeed, 0, 3);
		this.simTime += effectiveDt;

		if (this.S.Wave.mission) {
			this.P.run(this.S.Wave.spawnerId, () => this.S.Wave.tick(effectiveDt));
		}
		if (this.S.Wave.activeWave > 0) {
			this.P.run(this.S.Enemy.moveId, () => this.S.Enemy.tick(effectiveDt));
		}
	}
}

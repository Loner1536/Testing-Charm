// Services
import { ServerStorage, Workspace, RunService, HttpService, Players } from "@rbxts/services";

// Packages
import { OnStart, Service } from "@flamework/core";
import { NetworkData } from "@shared/network";
import { Entity } from "@rbxts/jecs";

// Dependencies
import StateManager from "../stateManager";
import JecsManager from "../jecsManager";
import Object from "@rbxts/object-utils";

// Assets
const maps = ServerStorage.WaitForChild("assets").WaitForChild("models").WaitForChild("maps") as Folder;

type TeleportData = {
	type: "story" | "raid";
	id: string;
	act: number;
};

@Service()
export default class WaveManager implements OnStart {
	private getState: () => NetworkData.State.WaveData.Default;
	private enemies: Map<string, Entity> = new Map();
	private votes: Map<string, boolean> = new Map();
	private enemiesConnection!: RBXScriptConnection;
	private teleportData!: TeleportData;
	private sim!: JecsManager["sim"];

	constructor(stateManager: StateManager, jecsManager: JecsManager) {
		this.getState = stateManager.waveData.get;
		this.sim = jecsManager.sim;
	}

	onStart(): void {
		this.teleportData = {
			type: "story",
			id: "Sand Village",
			act: 1,
		};

		const map = maps.FindFirstChild(this.teleportData.id) as Model;
		map.Parent = Workspace;
		map.Name = "Map";

		this.sim.waveManager.loadRoutes();
	}

	public network = {
		vote: (player: Player) => {
			print(`${player.Name} voted`);
		},
	};
}

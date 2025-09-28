// Services
import { Players } from "@rbxts/services";

// Packages
import { OnStart, Service } from "@flamework/core";
import Network from "@network/server";

// Configurations
import mapConfiguration, { TypeConfiguration } from "@shared/configurations/maps";

// Dependencies
import StateManager from "../stateManager";

type TeleportData = {
	type: keyof typeof mapConfiguration;
	id: string;
	act: number;
};

@Service()
export default class WaveManager implements OnStart {
	private mapConfig!: (typeof mapConfiguration)[TeleportData["type"]];
	private state!: Network.State.WaveData.Default;
	private teleportData!: TeleportData;
	private votes: string[] = [];

	constructor(private stateManager: StateManager) {
		this.state = this.stateManager.waveData.get();
	}

	onStart(): void {
		const teleportData: TeleportData = {
			type: "story",
			id: "test",
			act: 1,
		};

		this.teleportData = teleportData;

		const mapConfig = this.getMapConfig();
		print("mapConfig", mapConfig);

		this.stateManager.waveData.update((data) => {
			data.hpStocks = TypeConfiguration[this.teleportData.type].maxStocks;
			data.type = teleportData.type;
			data.mapId = teleportData.id;
			data.act = teleportData.act;

			return data;
		});
	}

	private getMapConfig() {
		const mapTypeConfig = mapConfiguration[this.teleportData.type];
		const map = mapTypeConfig;

		if (map) {
			return map;
		} else {
			return error(`Map ${this.teleportData.id} not found under type ${this.teleportData.type}`);
		}
	}

	public network = {
		vote: (player: Player) => {
			print(this.state);
			if (this.state.activeWave || this.votes.includes(tostring(player.UserId))) return;
			print(`${player.Name} voted to start the wave`);
			this.votes.push(tostring(player.UserId));

			this.stateManager.waveData.update((data) => {
				data.votes = this.votes.size();
				return data;
			});

			if (this.votes.size() >= Players.GetPlayers().size()) {
				print("Starting wave due to votes");
				this.stateManager.waveData.update((data) => {
					data.activeWave = true;
					return data;
				});
			}
		},
	};
}

// Packages
import { OnInit, Service } from "@flamework/core";
import Network from "@shared/network";

// Dependencies
import StateManager from "../stateManager";
import WaveManager from "../waveManager";
import DataManager from "../dataManger";

@Service()
export default class NetworkManager implements OnInit {
	public wave!: WaveManager["network"];

	constructor(
		private stateManager: StateManager,
		private dataManager: DataManager,
		private waveManager: WaveManager,
	) {
		this.wave = waveManager.network;
	}

	onInit() {
		this.setupWaveNetworking();
	}

	private setupWaveNetworking() {
		Network.server.on(Network.keys.wave.vote, (player) => this.wave.vote(player));
	}
}

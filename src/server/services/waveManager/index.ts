// Services
import { Players } from "@rbxts/services";

// Packages
import { OnStart, Service } from "@flamework/core";
import Network from "@network/server";

// Dependencies
import StateManager from "../stateManager";

@Service()
export class DataStore implements OnStart {
	private state!: Network.State.WaveData.Default;
	private votes: string[] = [];

	constructor(private stateManager: StateManager) {}

	onStart(): void {
		this.state = this.stateManager.waveData.get();

		Network.Wave.vote.on((player) => {
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
		});
	}
}

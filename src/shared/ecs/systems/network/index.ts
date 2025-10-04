// Services
import { Players } from "@rbxts/services";

// Types
import type * as Types from "@shared/types";

export default class NetworkSystem {
	public constructor(private sim: Types.Core.API) {}

	public Wave = {
		Vote: (player: Player) => {
			this.sim.StateManager.waveData.update((data) => {
				if (this.sim.S.Wave.waveActive) return data;

				const votes = this.sim.S.Wave.votes;

				if (votes.has(tostring(player.UserId))) return data;

				this.sim.S.Wave.votes.set(tostring(player.UserId), true);

				data.votes = votes.size();

				if (votes.size() >= Players.GetPlayers().size()) {
					data.vote = false;

					if (this.sim.S.Wave.activeWave === 0) this.sim.S.Wave.startMission();

					this.sim.S.Wave.nextWave();
				}

				return data;
			});
		},
		GameSpeed: (speed: number) => {
			this.sim.StateManager.waveData.update((data) => {
				const clampedSpeed = math.floor(math.clamp(speed, 1, 3));

				this.sim.S.Wave.gameSpeed = clampedSpeed;
				data.speed = clampedSpeed;

				return data;
			});
		},
	};
}

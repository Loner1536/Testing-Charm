// Packages
import { SyncPayload } from "@rbxts/charm-sync";
import { NetworkData } from "@shared/network";
import Object from "@rbxts/object-utils";
import Remap from "@rbxts/remap";

// Components
import states from "@shared/states";

export default class WaveData {
	private state = states.waveData;

	public filterPayload(payload: SyncPayload<typeof states>): SyncPayload<typeof states> {
		if (payload.type === "init") {
			return {
				...payload,
				data: {
					...payload.data,
					waveData: payload.data.waveData,
				},
			};
		}

		const enemies = payload.data.waveData?.enemies;

		let filteredEnemies: typeof enemies | undefined;

		if (enemies) {
			if (next(enemies)[0] === undefined) {
				filteredEnemies = undefined;
			} else {
				filteredEnemies = Remap.filter(enemies, (enemy) => !Object.isEmpty(enemy));
			}
		}

		return {
			...payload,
			data: {
				...payload.data,
				waveData: {
					...payload.data.waveData,
					enemies: filteredEnemies,
				},
			},
		};
	}

	public get() {
		return this.state();
	}

	public update(updater: (data: NetworkData.State.WaveData.Default) => NetworkData.State.WaveData.Default) {
		this.state((state) => {
			const newState = Object.deepCopy(state);
			return updater(newState);
		});
	}
}

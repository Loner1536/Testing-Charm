// Packages
import { SyncPayload } from "@rbxts/charm-sync";
import Object from "@rbxts/object-utils";
import { NetworkData } from "@shared/network";

// Components
import states from "@shared/states";

export default class PlayerData {
	private state = states.players;

	public filterPayload(player: Player, payload: SyncPayload<typeof states>): SyncPayload<typeof states> {
		if (payload.type === "init") {
			return {
				...payload,
				data: {
					...payload.data,
					players: new Map([[tostring(player.UserId), payload.data.players.get(tostring(player.UserId))!]]),
				},
			};
		}

		return {
			...payload,
			data: {
				...payload.data,
				players: payload.data.players
					? new Map([[tostring(player.UserId), payload.data.players.get(tostring(player.UserId))!]])
					: undefined,
			},
		};
	}

	public get(id: string) {
		return this.state().get(id);
	}

	public set(id: string, newData: NetworkData.State.PlayerData.Default) {
		return this.state((state) => {
			const newState = Object.deepCopy(state);
			newState.set(id, newData);
			return newState;
		});
	}

	public update(
		id: string,
		updater: (data: NetworkData.State.PlayerData.Default) => NetworkData.State.PlayerData.Default,
	) {
		this.state((state) => {
			const newState = Object.deepCopy(state);

			const data = newState.get(id);

			if (!data) return state;

			newState.set(id, updater(data));

			return newState;
		});
	}

	public delete(id: string) {
		this.state((state) => {
			const newState = Object.deepCopy(state);
			newState.delete(id);
			return newState;
		});
	}
}

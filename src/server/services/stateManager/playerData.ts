// Packages
import { SyncPayload } from "@rbxts/charm-sync";
import Object from "@rbxts/object-utils";
import Network from "@network/server";

// Components
import states from "@shared/states";

export default class PlayerData {
	private state = states.players;

	public filterPlayers(userId: string, payload: SyncPayload<typeof states>) {
		if (payload.type === "init") {
			return {
				...payload,
				data: {
					...payload.data,
					players: {
						[userId]: payload.data.players.get(userId),
					},
				},
			};
		}

		return {
			...payload,
			data: {
				...payload.data,
				players: payload.data.players && {
					[userId]: payload.data.players.get(userId),
				},
			},
		};
	}

	public get(id: string) {
		return this.state().get(id);
	}

	public set(id: string, newData: Network.State.PlayerData.Default) {
		return this.state((state) => {
			const newState = Object.deepCopy(state);
			newState.set(id, newData);
			return newState;
		});
	}

	public update(id: string, updater: (data: Network.State.PlayerData.Default) => Network.State.PlayerData.Default) {
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

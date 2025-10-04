// Services
import { RunService } from "@rbxts/services";

// Packages
import { SyncPayload } from "@rbxts/charm-sync";
import { NetworkData } from "@shared/network";
import { useAtom } from "@rbxts/vide-charm";
import Object from "@rbxts/object-utils";

// Components
import states from "./states";

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

	public getState(id: string) {
		return this.state().get(id);
	}

	public getProps(player: Player) {
		if (RunService.IsServer() && RunService.IsRunning()) {
			return warn("[PlayerData] getProps should only be called on the client");
		}

		return {
			gems: useAtom(() => this.state().get(tostring(player.UserId))?.gems ?? 0),
			gold: useAtom(() => this.state().get(tostring(player.UserId))?.gold ?? 0),
		};
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
		if (RunService.IsClient()) return warn("[PlayerData] update should only be called on the server");

		this.state((state) => {
			const newState = Object.deepCopy(state);

			const data = newState.get(id);

			if (!data) return state;

			newState.set(id, updater(data));

			return newState;
		});
	}

	public delete(id: string) {
		if (RunService.IsClient()) return warn("[PlayerData] delete should only be called on the server");

		this.state((state) => {
			const newState = Object.deepCopy(state);
			newState.delete(id);
			return newState;
		});
	}
}

// Packages
import { PlayerStore } from "@rbxts/lyra";
import Network from "@network/server";

export default class NetworkConnections {
	private store: PlayerStore<Network.DataStore.Player.Default>;

	constructor(store: PlayerStore<Network.DataStore.Player.Default>) {
		this.store = store;

		Network.DataStore;
	}

	private dataStore(player: Player, transformer: (data: Network.DataStore.Player.Default) => boolean) {
		return this.store.updateAsync(player, transformer);
	}

	private unit(playerData: Network.DataStore.Player.Default) {
		return {
			kill: (player: Player) =>
				this.dataStore(player, () => {
					return false;
				}),
		};
	}
}

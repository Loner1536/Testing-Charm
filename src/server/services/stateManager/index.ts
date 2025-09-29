// Packages
import { OnInit, Service } from "@flamework/core";
import { SyncPayload } from "@rbxts/charm-sync";
import { server } from "@rbxts/charm-sync";
import Network from "@network/server";

// Components
import states from "@shared/states";

// Children
import PlayerData from "./playerData";
import WaveData from "./waveData";

@Service()
export default class StateManager implements OnInit {
	private syncer = server({ atoms: states });

	public playerData = new PlayerData();
	public waveData = new WaveData();

	private filterPayload(userId: string, payload: SyncPayload<typeof states>) {
		return this.playerData.filterPlayers(userId, payload);
	}

	onInit(): void {
		this.syncer.connect((player, payload) => {
			print(this.filterPayload(tostring(player.UserId), payload));
			Network.State.sync.fire(player, this.filterPayload(tostring(player.UserId), payload) as never);
		});
		Network.State.init.on((player) => {
			this.syncer.hydrate(player);
		});
	}
}

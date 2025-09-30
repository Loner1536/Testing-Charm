// Packages
import { toSerializeablePayload } from "@rbxts/charm-payload-converter";
import { OnInit, Service } from "@flamework/core";
import CharmSync, { SyncPayload } from "@rbxts/charm-sync";
import { server } from "@rbxts/charm-sync";
import Network from "@shared/network";

// Components
import states from "@shared/states";

// Children
import PlayerData from "./playerData";
import WaveData from "./waveData";

@Service()
export default class StateManager implements OnInit {
	private syncer = server({ atoms: states, autoSerialize: false });

	public playerData = new PlayerData();
	public waveData = new WaveData();

	private filterPayload(player: Player, payload: SyncPayload<typeof states>): SyncPayload<typeof states> {
		return {
			...payload,
			...this.playerData.filterPayload(player, payload),
			...this.waveData.filterPayload(payload),
		};
	}

	onInit(): void {
		this.syncer.connect((player, payload) => {
			const filteredPayload = this.filterPayload(player, payload);
			if (CharmSync.isNone(filteredPayload)) return;

			Network.client.fire(player, Network.keys.state.sync, toSerializeablePayload(filteredPayload));
		});
		Network.server.on(Network.keys.state.init, (player) => this.syncer.hydrate(player));
	}
}

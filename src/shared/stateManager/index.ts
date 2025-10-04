// Services
import { RunService } from "@rbxts/services";

// Packages
import { toSerializeablePayload, fromSerializeablePayload } from "@rbxts/charm-payload-converter";
import CharmSync, { type SyncPayload } from "@rbxts/charm-sync";
import { server, client } from "@rbxts/charm-sync";
import Network from "@shared/network";

// Components
import states from "@shared/stateManager/states";

// Children
import PlayerData from "./playerData";
import WaveData from "./waveData";

export default class StateManager {
	public playerData = new PlayerData();
	public waveData = new WaveData();

	constructor() {
		if (!RunService.IsRunning()) return;

		if (RunService.IsServer()) {
			const syncer = server({ atoms: states, autoSerialize: false });

			syncer.connect((player, payload) => {
				const filteredPayload = this.filterPayload(player, payload);
				if (CharmSync.isNone(filteredPayload)) return;

				Network.client.emit(player, Network.keys.state.sync, toSerializeablePayload(filteredPayload));
			});

			Network.server.on(Network.keys.state.init, (player) => syncer.hydrate(player));
		} else {
			const syncer = client({ atoms: states });

			Network.client.on(Network.keys.state.sync, (payload) => {
				syncer.sync(fromSerializeablePayload(payload));
			});

			Network.server.emit(Network.keys.state.init);
		}
	}

	private filterPayload(player: Player, payload: SyncPayload<typeof states>): SyncPayload<typeof states> {
		return {
			...payload,
			...this.playerData.filterPayload(player, payload),
		};
	}
}

// Packages
import { fromSerializeablePayload } from "@rbxts/charm-payload-converter";
import { OnInit, Controller } from "@flamework/core";
import { client } from "@rbxts/charm-sync";
import Network from "@shared/network";

// Components
import states from "@shared/states";

// Children
import PlayerData from "./playerData";
import WaveData from "./waveData";

@Controller()
export default class StateManager implements OnInit {
	private syncer = client({ atoms: states });

	public playerData = new PlayerData();
	public waveData = new WaveData();

	onInit(): void {
		Network.client.on(Network.keys.state.sync, (payload) => {
			this.syncer.sync(fromSerializeablePayload(payload));
		});
		Network.server.fire(Network.keys.state.init);
	}
}

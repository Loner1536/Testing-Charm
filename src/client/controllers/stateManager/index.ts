// Packages
import { OnInit, Controller } from "@flamework/core";
import { client } from "@rbxts/charm-sync";
import Network from "@network/client";

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
		Network.State.sync.on((payload) => {
			this.syncer.sync(payload as never);
		});
		Network.State.init.fire();
	}
}

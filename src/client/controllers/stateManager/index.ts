// Packages
import { OnInit, Controller } from "@flamework/core";
import { client } from "@rbxts/charm-sync";
import Network from "@network/client";

// Components
import states from "@shared/states";

@Controller()
export default class StateManager implements OnInit {
	private syncer = client({ atoms: states });

	onInit(): void {
		Network.State.sync.on((payload) => {
			this.syncer.sync(payload as never);
		});
		Network.State.init.fire();
	}

	public get<K extends keyof typeof states>(id: K): (typeof states)[K] {
		return states[id];
	}
}

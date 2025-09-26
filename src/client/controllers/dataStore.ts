// Packages
import { Controller, OnStart } from "@flamework/core";
import CharmSync from "@rbxts/charm-sync";
import Network from "@network/client";

// Charm Components
const { client } = CharmSync;

import atoms from "shared/atoms";

const syncer = client({ atoms });

@Controller()
export class Interface implements OnStart {
	onStart() {
		Network.DataStore.Atoms.sync.on((payload) => {
			syncer.sync(payload as never);
		});
		Network.DataStore.Atoms.init.fire();
	}
}

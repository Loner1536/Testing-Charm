// Packages
import { Service, OnStart } from "@flamework/core";
import Network from "@shared/network";

// Components
import { getWorld } from "@shared/replicator";
import replicator from "@client/replicator";
import { Players } from "@rbxts/services";

@Service()
export default class JecsManager implements OnStart {
	public world = getWorld();
	public debug = true;

	onStart() {
		Network.server.invoke(Network.keys.jecs.receiveFull, Network.keys.jecs.receiveFullReturn).then((data) => {
			replicator.apply_full(data.buf, data.variants);
		});
	}
}

// Services
import { Service, OnStart } from "@flamework/core";
import Network from "@shared/network";

// Components
import replicator from "@client/replicator";
import getSim from "@shared/ecs";

@Service()
export default class JecsManager implements OnStart {
	public sim = getSim();
	public debug = true;

	onStart() {
		Network.server.invoke(Network.keys.jecs.receiveFull, Network.keys.jecs.receiveFullReturn).then((data) => {
			if (!data) return;

			replicator.apply_full(data[0], data[1]);
		});
	}
}

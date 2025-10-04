// Services
import { Service, OnStart } from "@flamework/core";

// Components
import getSim from "@shared/ecs";

@Service()
export default class JecsManager implements OnStart {
	public sim = getSim();

	// TODO: Find out how to serialize
	onStart() {
		// Network.server.invoke(Network.keys.jecs.receiveFull, Network.keys.jecs.receiveFullReturn).then((data) => {
		// 	if (!data) return;
		// 	replicator.apply_full(data[0], data[1]);
		// });
	}
}

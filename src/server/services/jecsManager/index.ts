// Packages
import { Service, OnStart } from "@flamework/core";
import Network from "@shared/network";

// Components
import replicator from "@server/replicator";
import getSim from "@shared/ecs";

@Service()
export default class JecsManager implements OnStart {
	public sim = getSim();
	public debug = true;

	onStart() {
		Network.server.setCallback(
			Network.keys.jecs.receiveFull,
			Network.keys.jecs.receiveFullReturn,
			(player: Player) => {
				if (!replicator.is_player_ready(player)) {
					return undefined;
				}
				replicator.mark_player_ready(player);
				return replicator.get_full(player);
			},
		);
	}
}

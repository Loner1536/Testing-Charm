// Packages
import { Service, OnStart } from "@flamework/core";
import Network from "@shared/network";

// Components
import replicator from "@server/replicator";
import getSim from "@shared/ecs";

@Service()
export default class JecsManager implements OnStart {
	public sim = getSim();

	// TODO: Find out how to serialize
	onStart() {
		// Network.server.setCallback(
		// 	Network.keys.jecs.receiveFull,
		// 	Network.keys.jecs.receiveFullReturn,
		// 	(player: Player) => {
		// 		if (!replicator.is_player_ready(player)) {
		// 			warn(`${player.Name} is not ready for full replication`);
		// 			return undefined;
		// 		}
		// 		replicator.mark_player_ready(player);
		// 		return replicator.get_full(player);
		// 	},
		// );
	}
}

// Packages
import { Service, OnStart } from "@flamework/core";
import Network from "@shared/network";

// Components
import { registerComponents } from "@shared/ecs/components";
import { getWorld } from "@shared/replicator";
import replicator from "@server/replicator";

@Service()
export default class JecsManager implements OnStart {
	public components!: ReturnType<typeof registerComponents>;
	public world = getWorld();
	public debug = true;

	onStart() {
		this.components = registerComponents(this.world);

		Network.server.setCallback(
			Network.keys.jecs.receiveFull,
			Network.keys.jecs.receiveFullReturn,
			(player: Player) => {
				replicator.mark_player_ready(player);

				const [buf, variants] = replicator.get_full(player);
				return { buf, variants };
			},
		);
	}
}

// Packages
import { Service, OnStart } from "@flamework/core";

// Components
import { registerComponents } from "@shared/ecs/components";
import replicator, { getWorld } from "@shared/replicator";

@Service()
export default class JecsManager implements OnStart {
	public components!: ReturnType<typeof registerComponents>;
	public world = getWorld();
	public debug = true;

	onStart() {
		this.components = registerComponents(this.world);
	}
}

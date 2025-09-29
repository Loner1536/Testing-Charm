// Packages
import { Service, OnStart } from "@flamework/core";
import { world } from "@rbxts/jecs";

// Components
import { registerComponents } from "@shared/ecs/components";

@Service()
export default class JecsManager implements OnStart {
	public components!: ReturnType<typeof registerComponents>;
	public world = world();
	public debug = true;

	onStart() {
		this.components = registerComponents(this.world);
	}
}

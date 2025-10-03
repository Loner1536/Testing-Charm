// Packages
import { Name, Entity } from "@rbxts/jecs";

// Sim
import getSim from "@shared/ecs";

const sim = getSim();
const world = sim.world;

export function add_names(entities: Record<string, Entity<unknown>>): Record<string, Entity<unknown>> {
	for (const [name, entity] of pairs(entities)) {
		world.set(entity, Name, name);
	}
	return entities;
}

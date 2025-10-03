// Packages
import Replecs from "@rbxts/replecs";
import { Entity } from "@rbxts/jecs";

// Sim
import getSim from "@shared/ecs";

const sim = getSim();
const world = sim.world;

export function add_shared(entities: Record<string, Entity<unknown>>): Record<string, Entity<unknown>> {
	for (const [, entity] of pairs(entities)) {
		world.add(entity as Entity<unknown>, Replecs.shared);
	}
	return entities;
}

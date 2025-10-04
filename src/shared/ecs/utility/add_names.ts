// Packages
import { Name, Entity } from "@rbxts/jecs";

// Types
import type * as Types from "@shared/types";

export default class EntityNamer {
	constructor(public sim: Types.Core.API) {}

	public addNames(entities: Record<string, Entity<unknown>>): Record<string, Entity<unknown>> {
		for (const [name, entity] of pairs(entities)) {
			this.sim.world.set(entity, Name, name);
		}
		return entities;
	}
}

// Packages
import Replecs from "@rbxts/replecs";
import { Entity } from "@rbxts/jecs";

// Types
import type * as Types from "@shared/types";

export default class EntitySharer {
	constructor(public sim: Types.Core.API) {}

	public addShared(entities: Record<string, Entity<unknown>>): Record<string, Entity<unknown>> {
		for (const [, entity] of pairs(entities)) {
			this.sim.world.add(entity as Entity<unknown>, Replecs.shared);
		}
		return entities;
	}
}

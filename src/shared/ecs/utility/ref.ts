// Packages
import { Entity } from "@rbxts/jecs";

// Types
import type * as Types from "@shared/types";

export default class RefManager {
	private refs = new Map<unknown, Entity>();

	constructor(public sim: Types.Core.API) {}

	public ref(key?: unknown, initer?: (entity: Entity) => void): Entity {
		if (key === undefined) {
			return this.sim.world.entity();
		}

		let entity = this.refs.get(key);
		if (!entity) {
			entity = this.sim.world.entity();

			if (initer) initer(entity);

			this.refs.set(key, entity);
		}

		return entity;
	}

	public search(key: unknown): Entity | undefined {
		if (key === undefined) return undefined;
		return this.refs.get(key);
	}

	public set(key: unknown, entity: Entity) {
		this.refs.set(key, entity);
	}

	public unlist(key: unknown) {
		if (key === undefined) return;
		this.refs.delete(key);
	}
}

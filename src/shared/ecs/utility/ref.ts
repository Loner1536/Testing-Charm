// Packages
import { Entity } from "@rbxts/jecs";

// Sim
import getSim from "@shared/ecs";

const sim = getSim();
const world = sim.world;

const refs = new Map<unknown, Entity>();

/**
 * Gets an entity the given key references to.
 * If the key is nil, an entirely new entity is created and returned.
 * If the key doesn't reference an entity, a new entity is made for it to reference and returned.
 * @param key any
 */
function ref(key?: unknown, initer?: (entity: Entity) => void): Entity {
	if (!key) {
		return world.entity();
	}

	let entity = refs.get(key);
	if (!entity) {
		entity = world.entity();

		if (initer) {
			initer(entity);
		}

		refs.set(key, entity);
	}

	return entity;
}

function search(key: unknown): Entity | undefined {
	if (!key) {
		return undefined;
	}
	return refs.get(key);
}

function set(key: unknown, entity: Entity) {
	refs.set(key, entity);
}

function unlist(key: unknown) {
	if (!key) {
		return;
	}
	refs.delete(key);
}

export { ref as default, search, set, unlist };

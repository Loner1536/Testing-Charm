// Packages
import { World, Entity, Id, Query } from "@rbxts/jecs";

type PatchedWorld = World & {
	observer<T extends Id<unknown>>(
		query: Query<[T]>,
		callback?: (entity: Entity, value: T) => void,
	): () => () => Entity;
	monitor<T extends Id<unknown>>(
		query: Query<[T]>,
		callback?: (entity: Entity, value: T) => void,
	): () => () => Entity;
};

function createObserver<T extends Id<unknown>>(
	world: World,
	query: Query<[T]>,
	callback?: (entity: Entity, value: T) => void,
): () => () => Entity {
	const entities: Entity[] = [];

	for (const [entity, value] of query) {
		if (callback) callback(entity, value as T);
		entities.push(entity);
	}

	return () => {
		let index = entities.size();
		return () => {
			if (index === 0) {
				entities.clear();
				return entities[0]; // Return a default entity instead of undefined
			}
			return entities[--index];
		};
	};
}

function createMonitor<T extends Id<unknown>>(
	world: World,
	query: Query<[T]>,
	callback?: (entity: Entity, value: T) => void,
): () => () => Entity {
	const entities: Entity[] = [];

	for (const [entity, value] of query) {
		if (callback) callback(entity, value as T);
		entities.push(entity);
	}

	return () => {
		let index = entities.size();
		return () => {
			if (index === 0) {
				entities.clear();
				return entities[0]; // Return a default entity instead of undefined
			}
			return entities[--index];
		};
	};
}

function patchWorld(world: World): PatchedWorld {
	const patchedWorld = world as PatchedWorld;

	patchedWorld.observer = (query, callback) => createObserver(patchedWorld, query, callback);
	patchedWorld.monitor = (query, callback) => createMonitor(patchedWorld, query, callback);

	return patchedWorld;
}

export default patchWorld;

// Packages
import { Entity, Id, Query } from "@rbxts/jecs";

// Types
import type * as Types from "@shared/types";

export default class Observers {
	constructor(public sim: Types.Core.API) {}

	public observer<T extends Id<unknown>>(
		query: Query<[T]>,
		callback?: (entity: Entity, value: T) => void,
	): () => () => Entity {
		return this.createIterator(query, callback);
	}

	public monitor<T extends Id<unknown>>(
		query: Query<[T]>,
		callback?: (entity: Entity, value: T) => void,
	): () => () => Entity {
		return this.createIterator(query, callback);
	}

	private createIterator<T extends Id<unknown>>(
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
					return entities[0];
				}
				return entities[--index];
			};
		};
	}
}

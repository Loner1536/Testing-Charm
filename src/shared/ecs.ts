type Constructor<T extends object = {}> = new (...args: any[]) => T;

export default class ECS {
	private static registries = new Map<Constructor<object>, Map<unknown, unknown>>();

	private static getRegistry<T extends object>(ctor: Constructor<T>) {
		if (!this.registries.has(ctor)) {
			this.registries.set(ctor, new Map<unknown, T>());
		}
		return this.registries.get(ctor)! as Map<unknown, T>;
	}

	static add<T extends object>(key: unknown, entity: T, ctor: Constructor<T>) {
		this.getRegistry(ctor).set(key, entity);
	}

	static get<T extends object>(key: unknown, ctor: Constructor<T>): T | undefined {
		return this.getRegistry(ctor).get(key);
	}

	static remove<T extends object>(key: unknown, ctor: Constructor<T>) {
		this.getRegistry(ctor).delete(key);
	}
}

/** Decorator for automatic ECS registration */
export function Entity<T extends Constructor<object>>() {
	return function (ctor: T) {
		return class extends ctor {
			// Roblox TS requires this exact signature for mixin decorators
			constructor(...args: any[]) {
				super(...(args as unknown[]));
				const instance = this as unknown as { model?: unknown };
				const key = instance.model ?? instance;
				ECS.add(key, this, ctor as unknown as Constructor<object>);
			}
		} as T;
	};
}

export class ECS {
  private static registries = new Map<Constructor<any>, Map<any, any>>();

  private static getRegistry<T>(ctor: Constructor<T>) {
    if (!this.registries.has(ctor)) {
      this.registries.set(ctor, new Map<any, T>());
    }
    return this.registries.get(ctor)! as Map<any, T>;
  }

  static add<T>(key: any, entity: T, ctor: Constructor<T>) {
    this.getRegistry(ctor).set(key, entity);
  }

  static get<T>(key: any, ctor: Constructor<T>): T | undefined {
    return this.getRegistry(ctor).get(key);
  }

  static remove<T>(key: any, ctor: Constructor<T>) {
    this.getRegistry(ctor).delete(key);
  }
}

type Constructor<T> = new (...args: any[]) => T;

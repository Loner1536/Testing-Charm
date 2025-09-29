import jecs, { World, Entity, Tag } from "@rbxts/jecs";

// Enemy Components
export type EnemyComponents = {
	enemy: Tag;
	health: Entity<number>;
	predictedHP: Entity<number>;
	pathIndex: Entity<number>;
	position: Entity<Vector3>;
	speed: Entity<number>;
	enemyType: Entity<string>;
};

// Tower Components
export type TowerComponents = {
	tower: Tag;
	damage: Entity<number>;
	range: Entity<number>;
	spa: Entity<number>;
	target: Entity<Entity | undefined>;
};

export type Components = ReturnType<typeof registerComponents>;

export function registerComponents(world: World) {
	const enemy = {
		enemy: jecs.tag(),
		health: world.component<number>(),
		predictedHP: world.component<number>(),
		pathIndex: world.component<number>(),
		position: world.component<Vector3>(),
		speed: world.component<number>(),
		enemyType: world.component<string>(),
	} satisfies EnemyComponents;

	const tower = {
		tower: jecs.tag(),
		damage: world.component<number>(),
		range: world.component<number>(),
		spa: world.component<number>(),
		target: world.component<Entity | undefined>(),
	} satisfies TowerComponents;

	return {
		...enemy,
		...tower,
	};
}

// Packages
import { World, Name } from "@rbxts/jecs";
import { Shared } from "@rbxts/replecs";

// Types
import * as Types from "@shared/types";

export default class Components {
	constructor(private world: World) {}

	// --- Tags ---
	public Tags = {
		Enemy: this.defineTag("Enemy"),
		Tower: this.defineTag("Tower"),
		Boss: this.defineTag("Boss"),

		Predicted: this.defineTag("Predicated"),
		Completed: this.defineTag("Completed"),
		Dead: this.defineTag("Dead"),
	} as const;

	public Grid = {
		PathProgress: this.defineComponent<{ node: number; progress: number }>("PathProgress"),
		SpawnMeta: this.defineComponent<{ time: number; order: number }>("SpawnMeta"),
		Orientation: this.defineComponent<number>("Orientation"),
		SpawnPoint: this.defineComponent<Vector2>("SpawnPoint"),
		PathIndex: this.defineComponent<number>("PathIndex"),
		MoveDir: this.defineComponent<Vector2>("MoveDir"),
		World: this.defineComponent<Vector2>("WorldPos"),
		Grid: this.defineComponent<Vector2>("GridPos"),
		Height: this.defineComponent<number>("Height"),
	} as const;

	public Enemy = {
		Id: this.defineComponent<string>("EnemyId"),

		KillCreditOwnerId: this.defineComponent<string>("KillCreditOwnerId"),
		RouteIndex: this.defineComponent<number>("RouteIndex"),

		PredictedHealth: this.defineComponent<number>("PredicatedHealth"),
		MaxHealth: this.defineComponent<number>("MaxHealth"),
		Health: this.defineComponent<number>("Health"),
		Speed: this.defineComponent<number>("Speed"),

		ShieldMultiplier: this.defineComponent<number>("ShieldMultiplier"),
		MaxShield: this.defineComponent<number>("MaxShield"),
		Shield: this.defineComponent<number>("Shield"),

		Bounty: this.defineComponent<number>("Bounty"),
	} as const;

	public Stats = {
		LeakDamage: this.defineComponent<number>("LeakDamage"),
	};

	public Tower = {
		Id: this.defineComponent<string>("TowerId"),

		Class: this.defineComponent<Types.Core.Tower.Class>("Class"),
		PlacementTime: this.defineComponent<number>("PlacementTime"),
		OwnerId: this.defineComponent<string>("OwnerId"),
	} as const;

	public Attack = {
		TargetMode: this.defineComponent<Types.Core.Attack.TargetMode>("TargetMode"),
		Cooldown: this.defineComponent<Types.Core.Attack.Cooldown>("Cooldown"),
		Damage: this.defineComponent<number>("Damage"),
		Range: this.defineComponent<number>("Range"),

		Profile: this.defineComponent<Types.Core.Attack.Profile>("AttackProfile"),
		Event: this.defineComponent<Types.Core.Attack.Event>("AttackEvent"),
	} as const;

	// --- Helpers ---
	private defineComponent<T>(name: string) {
		const comp = this.world.component<T>();
		this.world.set(comp, Name, name);
		this.world.add(comp, Shared);
		return comp;
	}

	private defineTag(name: string) {
		const tag = this.world.entity();
		this.world.set(tag, Name, name);
		this.world.add(tag, Shared);
		return tag;
	}
}

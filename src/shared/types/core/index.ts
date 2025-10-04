// Packages
import { World, Entity, Name } from "@rbxts/jecs";

// Types
import type { SystemId } from "@rbxts/jabby/out/jabby/modules/types";
import type MapConfiguration from "@shared/configurations/maps";
import type Components from "@shared/ecs/components";
import type Core from "@shared/ecs/core";

export type Options = {
	grid: Grid.Config;
	path: Vector2[];
	spawn: Wave.SpawnConfig;
	onTowerReimbursed?: (tower: Entity, amount: number) => void;
};

export type API = Core;

export namespace Route {
	export type BuilderConfig = {
		grid: {
			width: number;
			height: number;
			tileSize: number;
		};
	};

	export type Info = {
		name: string;
		path: Vector3[];
		models: DefinedModel[];
	};

	export type DefinedModel = Model & {
		Parent: Folder;
		Start: BasePart;
		End: BasePart;
	};
}

export namespace Wave {
	export type Emission = {
		time: number;
		enemy: string;
		routeIndex: number;
		boss?: boolean;
	};
	export type activeSpawn = {
		spawnConfig: Map.WaveSpawn;
		timer: number;
		remaining: number;
	};
}

export namespace Utility {
	export namespace Scheduler {
		export type OrderedSystems = Array<string | ((...args: unknown[]) => void)>;

		export type EventMap = Map<unknown, Systems>;
		export type Systems = System[];
		export type System = {
			callback: (...args: unknown[]) => void;
			name: string;
			id?: SystemId;
			group?: string;
		};
	}
}

export namespace Spawner {
	export type Context = {
		world: World;
		C: Components;
		enemyDefs: Map.EnemyTemplate[];
	};
}

export namespace Wave {
	export type SpawnConfig = {
		health: number;
		speed: number;
		rate: number;
	};
}

export namespace Attack {
	export type Profile = {
		shape: Type;
		range?: number;
		width?: number;
		angle?: number;
	};
	export type TargetMode = "first" | "last" | "strongest" | "weakest" | "closest" | "farthest" | "air";
	export type Event = { target?: Entity; targets?: Entity[]; name?: string };
	export type Cooldown = { current: number; max: number };
	export type Type = "circle" | "line" | "cone" | "full";
}

export namespace Grid {
	export type Config = {
		width: number;
		height: number;
		tileSize?: number;
	};
}

export namespace Party {
	export type TeleportData = {
		id: string;
		type: Map.Type;
		difficulty: Map.Difficulty;
	};

	export type Host = {
		type: "host";
		data: TeleportData;
	};
	export type Member = {
		type: "member";
	};
}

export namespace Map {
	export type Type = "story";

	export type Difficulty = "normal" | "nightmare";

	export type WaveSpawn = {
		at: number; // seconds from wave start
		enemy: string; // template id
		count?: number; // default 1
		interval: number; // seconds between spawns when count > 1
		/** Optional route index (0-based). Defaults to 0 (primary route). */
		routeIndex?: number;
		/** Optional: mark this spawn group as boss regardless of template flag. */
		boss?: boolean;
	};
	export type Wave = {
		id: string;
		spawns: WaveSpawn[];
		reward?: number; // optional currency reward
		/** Optional: declarative that this wave contains a boss (for UI prompts). */
		bossWave?: boolean;
	};
	export type Mission = {
		id: string;
		waves: Wave[];
		interWaveDelay?: number; // seconds between waves
		enemies: EnemyTemplate[];
	};
	export type EnemyTemplate = {
		id: string;
		health: number;
		speed: number; // tiles per second
		/** Optional marker so spawner can tag as Boss and UI can react. */
		boss?: boolean;
		/** Optional currency bounty for killing this enemy (server grants on death). */
		bounty?: number;
		/** Optional starting shield value that absorbs damage before health. */
		shield?: number;
		/** Optional incoming damage multiplier applied while shield > 0. Default 1. */
		shieldMultiplier?: number;
	};
}

export namespace Tower {
	export type Class = "ground" | "hill" | "hybrid";

	export type Config = {
		id: string;
		range: number;
		damage: number;
		cooldown: number;
		class?: Class;
		targetMode?: Attack.TargetMode;
		attack?: { shape: Attack.Type; range?: number; width?: number; angle?: number };
	};
	export type TowerData = {
		// Core identity
		name: string;
		rarity: string;
		level: number;

		// Stats
		damage: number;
		range: number;
		speed: number;

		// Economy
		cost: number;
		sellValue: number;

		// Performance tracking
		kills: number;
		totalDamage: number;

		// Behavior
		targetMode: Attack.TargetMode;

		// Upgrade system
		upgradeLevels: { damage: number; range: number; speed: number };
		upgradeCosts: { damage: number; range: number; speed: number };
		maxLevels: { damage: number; range: number; speed: number };
		canUpgrade: boolean;
	};
}

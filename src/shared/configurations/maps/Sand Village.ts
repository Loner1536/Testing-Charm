// Types
import type * as Types from "@shared/types";

export const Enemies: Types.Core.Map.EnemyTemplate[] = [
	{ id: "base", health: 10, speed: 3, bounty: 5 },
	{ id: "runner", health: 8, speed: 5, bounty: 6 },
	{ id: "heavy", health: 40, speed: 1.5, bounty: 20, shield: 12, shieldMultiplier: 1 },
	{ id: "boss", health: 2000, speed: 1.2, boss: true, bounty: 250, shield: 500, shieldMultiplier: 0.5 },
];

const SandVillage: Types.Core.Map.Mission = {
	id: "Sand Village",
	interWaveDelay: 5,
	enemies: Enemies,
	waves: [
		{
			id: "wave-1",
			spawns: [{ at: 0, enemy: "base", count: 5, interval: 0.4 }],
			reward: 25,
		},
		{
			id: "wave-2",
			spawns: [
				{ at: 0, enemy: "runner", count: 8, interval: 0.3 },
				{ at: 2, enemy: "base", count: 4, interval: 0.4 },
			],
			reward: 35,
		},
		{
			id: "wave-3",
			spawns: [
				{ at: 0, enemy: "heavy", count: 2, interval: 1 },
				{ at: 3, enemy: "base", count: 6, interval: 0.35 },
			],
			reward: 50,
		},
		{
			id: "wave-4",
			spawns: [
				{ at: 0, enemy: "base", count: 8, interval: 0.35 },
				{ at: 2.5, enemy: "runner", count: 6, interval: 0.3 },
			],
			reward: 40,
		},
		{
			id: "wave-5",
			spawns: [
				{ at: 0, enemy: "heavy", count: 3, interval: 1.2 },
				{ at: 1, enemy: "base", count: 8, interval: 0.35 },
			],
			reward: 55,
		},
		{
			id: "wave-6",
			spawns: [
				{ at: 0, enemy: "runner", count: 6, interval: 0.2, routeIndex: 1 },
				{ at: 0.4, enemy: "runner", count: 6, interval: 0.2, routeIndex: 2 },
				{ at: 0.8, enemy: "runner", count: 6, interval: 0.2, routeIndex: 3 },
				{ at: 3, enemy: "heavy", count: 2, interval: 0.9, routeIndex: 1 },
				{ at: 3.5, enemy: "heavy", count: 1, interval: 0.9, routeIndex: 2 },
				// Boss arrives late in final wave
				{ at: 6.5, enemy: "boss", count: 1, interval: 1.0, routeIndex: 1, boss: true },
			],
			reward: 120,
		},
	],
};

export default SandVillage;

// Types
import type * as Types from "@shared/types";
import { type Entity } from "@rbxts/jecs";

export default class TowerSystem {
	constructor(private sim: Types.Core.API) {}

	private getBuckets() {
		const buckets = new Map<string, Entity[]>();
		for (const [enemy, pos] of this.sim.world.query(this.sim.C.Vectors.World).with(this.sim.C.Tags.Enemy)) {
			if (this.sim.world.has(enemy, this.sim.C.Tags.Dead)) continue;
			const key = `${math.floor(pos.X)},${math.floor(pos.Y)}`;
			let arr = buckets.get(key);
			if (!arr) {
				arr = [] as Entity[];
				buckets.set(key, arr);
			}
			arr.push(enemy);
		}
		return buckets;
	}
	private updateCooldown(e: Entity, dt: number) {
		const cooldown = this.sim.world.get(e, this.sim.C.Attack.Cooldown) as
			| { current: number; max: number }
			| undefined;
		if (cooldown && cooldown.current > 0) {
			cooldown.current = math.max(0, cooldown.current - dt);
			this.sim.world.set(e, this.sim.C.Attack.Cooldown, cooldown);
		}
		return cooldown ? cooldown.current > 0 : false;
	}
}

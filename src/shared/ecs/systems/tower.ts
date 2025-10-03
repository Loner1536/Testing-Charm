// Types
import type * as Types from "@shared/types";
import { type Entity } from "@rbxts/jecs";

export default class TowerSystem {
	// Helpers
	private getBuckets(ctx: Types.Core.Systems.Context) {
		const buckets = new Map<string, Entity[]>();
		for (const [enemy, pos] of ctx.world.query(ctx.C.Grid.World).with(ctx.C.Tags.Enemy)) {
			if (ctx.world.has(enemy, ctx.C.Tags.Dead)) continue;
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
	private updateCooldown(ctx: Types.Core.Systems.Context, e: Entity, dt: number) {
		const cooldown = ctx.world.get(e, ctx.C.Attack.Cooldown) as { current: number; max: number } | undefined;
		if (cooldown && cooldown.current > 0) {
			cooldown.current = math.max(0, cooldown.current - dt);
			ctx.world.set(e, ctx.C.Attack.Cooldown, cooldown);
		}
		return cooldown ? cooldown.current > 0 : false;
	}

	// Core
	public attack(ctx: Types.Core.Systems.Context, dt: number) {
		// Clear previous attack events
		for (const [t] of ctx.world.query(ctx.C.Attack.Event)) ctx.world.remove(t, ctx.C.Attack.Event);
		// Precompute spatial buckets of enemies for faster range queries
		const buckets = this.getBuckets(ctx);

		// Process each tower
		for (const [tower, range, damage, cooldown] of ctx.world
			.query(ctx.C.Attack.Range, ctx.C.Attack.Damage, ctx.C.Attack.Cooldown)
			.with(ctx.C.Tags.Tower)) {
			// Skip if cooling down
			if (this.updateCooldown(ctx, tower, dt)) continue;

			const towerPos = ctx.world.get(tower, ctx.C.Grid.World);
			if (!towerPos) continue;

			// Check what to target
			const mode = ctx.world.get(tower, ctx.C.Attack.TargetMode);
			// if targetting = none then skip
			if (!mode) error(`Tower missing target mode: ${tower}`);

			const tClass = ctx.world.get(tower, ctx.C.Tower.Class);

			// Determine effective altitude preference
			// If tower has explicit altitude preference, use it
			// Otherwise, ground-only towers prefer ground, hybrid towers target all, air-only towers prefer air
			const effectiveAlt = tClass === "ground" ? "ground" : "all";
			let selected: Entity | undefined;
			let selectedDist = math.huge;
			let bestProgress = -math.huge;
			let worstProgress = math.huge;
			let strongestHp = -math.huge;
			let weakestHp = math.huge;

			const gx0 = math.floor(towerPos.X);
			const gy0 = math.floor(towerPos.Y);
			const rTiles = math.max(0, math.ceil(range));
			for (let dx = -rTiles; dx <= rTiles; dx++) {
				for (let dy = -rTiles; dy <= rTiles; dy++) {
					const list = buckets.get(`${gx0 + dx},${gy0 + dy}`);
					if (!list) continue;
					for (const enemy of list) {
						if (ctx.world.has(enemy, ctx.C.Tags.Dead)) continue;
						const ePos = ctx.world.get(enemy, ctx.C.Grid.World);
						if (!ePos) continue;
						const dist = ePos.sub(towerPos).Magnitude;
						if (dist > range) continue;
						let enemyIsAir = false;
						if (ctx.world.has(enemy, ctx.C.Grid.Height)) {
							enemyIsAir = (ctx.world.get(enemy, ctx.C.Grid.Height) ?? 0) > 0.5;
						}
						switch (effectiveAlt) {
							case "all":
								// can target anything
								break;
							case "ground":
								if (enemyIsAir) continue;
								break;
						}
						switch (mode) {
							case "first": {
								const prog = ctx.world.get(enemy, ctx.C.Grid.PathProgress);
								const score = prog ? prog.node + prog.progress : 0;
								if (
									score > bestProgress ||
									(math.abs(score - bestProgress) < 1e-6 && dist < selectedDist)
								) {
									bestProgress = score;
									selectedDist = dist;
									selected = enemy;
								}
								break;
							}
							case "last": {
								const prog = ctx.world.get(enemy, ctx.C.Grid.PathProgress);
								const score = prog ? prog.node + prog.progress : 0;
								if (
									score < worstProgress ||
									(math.abs(score - worstProgress) < 1e-6 && dist < selectedDist)
								) {
									worstProgress = score;
									selectedDist = dist;
									selected = enemy;
								}
								break;
							}
							case "strongest": {
								const hp = ctx.world.get(enemy, ctx.C.Enemy.Health) ?? 0;
								if (hp > strongestHp || (math.abs(hp - strongestHp) < 1e-6 && dist < selectedDist)) {
									strongestHp = hp;
									selectedDist = dist;
									selected = enemy;
								}
								break;
							}
							case "weakest": {
								const hp = ctx.world.get(enemy, ctx.C.Enemy.Health) ?? 0;
								if (hp < weakestHp || (math.abs(hp - weakestHp) < 1e-6 && dist < selectedDist)) {
									weakestHp = hp;
									selectedDist = dist;
									selected = enemy;
								}
								break;
							}
							default: {
								error(`Unknown tower target mode: ${mode}`);
							}
						}
					}
				}

				if (!selected) continue;

				const aimPos = ctx.world.get(selected, ctx.C.Grid.World);
				if (aimPos) {
					const v = aimPos.sub(towerPos);
					if (v.Magnitude > 1e-6) {
						ctx.world.set(tower, ctx.C.Grid.Orientation, math.atan2(v.Y, v.X));
						ctx.world.set(tower, ctx.C.Grid.MoveDir, v);
					}
				}

				const profile = ctx.world.get(tower, ctx.C.Attack.Profile);
				const shape = profile?.shape ?? "circle";
				const atkRange = profile?.range ?? range;
				const atkWidth = profile?.width ?? (shape === "line" ? range * 0.5 : 0);
				const atkAngle = profile?.angle ?? 60;

				const rawTargets: Entity[] = [];

				switch (shape) {
					case "full": {
						for (const [enemy, ePos] of ctx.world.query(ctx.C.Grid.World).with(ctx.C.Tags.Enemy)) {
							if (ctx.world.has(enemy, ctx.C.Tags.Dead)) continue;
							const d = ePos.sub(towerPos).Magnitude;
							if (d <= range) rawTargets.push(enemy);
						}
						break;
					}
					case "circle": {
						const center = ctx.world.get(selected, ctx.C.Grid.World) ?? towerPos;

						for (const [enemy, ePos] of ctx.world.query(ctx.C.Grid.World).with(ctx.C.Tags.Enemy)) {
							if (ctx.world.has(enemy, ctx.C.Tags.Dead)) continue;
							const d = ePos.sub(center).Magnitude;
							if (d <= atkRange) rawTargets.push(enemy);
						}
						break;
					}
					case "line": {
						const toPos = ctx.world.get(selected, ctx.C.Grid.World);
						const dir = toPos ? toPos.sub(towerPos) : new Vector2(1, 0);
						const len = dir.Magnitude > 1e-6 ? dir.Magnitude : 1;
						const norm = new Vector2(dir.X / len, dir.Y / len);

						for (const [enemy, ePos] of ctx.world.query(ctx.C.Grid.World).with(ctx.C.Tags.Enemy)) {
							if (ctx.world.has(enemy, ctx.C.Tags.Dead)) continue;
							const rel = ePos.sub(towerPos);
							const proj = rel.X * norm.X + rel.Y * norm.Y;
							if (proj < 0 || proj > atkRange) continue;
							const closest = new Vector2(norm.X * proj, norm.Y * proj);
							const perp = rel.sub(closest);
							if (perp.Magnitude <= atkWidth) rawTargets.push(enemy);
						}
						break;
					}
					case "cone": {
						const toPos = ctx.world.get(selected, ctx.C.Grid.World);
						const dir = toPos ? toPos.sub(towerPos) : new Vector2(1, 0);
						const len = dir.Magnitude > 1e-6 ? dir.Magnitude : 1;
						const norm = new Vector2(dir.X / len, dir.Y / len);
						const cosHalf = math.cos(math.rad(atkAngle / 2));

						for (const [enemy, ePos] of ctx.world.query(ctx.C.Grid.World).with(ctx.C.Tags.Enemy)) {
							if (ctx.world.has(enemy, ctx.C.Tags.Dead)) continue;
							const rel = ePos.sub(towerPos);
							const d = rel.Magnitude;
							if (d <= 1e-6 || d > atkRange) continue;
							const nd = (rel.X / d) * norm.X + (rel.Y / d) * norm.Y;
							if (nd >= cosHalf) rawTargets.push(enemy);
						}
						break;
					}
					default:
						error(`Unknown attack profile shape: ${shape}`);
				}

				const finalTargets = rawTargets.filter((enemy) => {
					if (effectiveAlt === "all") return true;

					let enemyIsAir = false;
					if (ctx.world.has(enemy, ctx.C.Grid.Height)) {
						enemyIsAir = (ctx.world.get(enemy, ctx.C.Grid.Height) ?? 0) > 0.5;
					}
					return !enemyIsAir;
				});

				const seen = new Set<Entity>();
				for (const e of finalTargets) {
					if (seen.has(e)) continue;
					seen.add(e);
					// Apply damage to shield first, with optional multiplier while shield > 0
					const baseDmg = damage as number;
					let remaining = baseDmg;
					const shieldCur = (ctx.world.get(e, ctx.C.Enemy.Shield) as number | undefined) ?? 0;
					if (shieldCur > 0 && remaining > 0) {
						const mult = (ctx.world.get(e, ctx.C.Enemy.ShieldMultiplier) as number | undefined) ?? 1;
						const eff = math.max(0, remaining * mult);
						const newShield = math.max(0, shieldCur - eff);
						ctx.world.set(e, ctx.C.Enemy.Shield, newShield);
						// If damage exceeds shield, allow overflow to HP with leftover raw damage scaled by how much shield consumed
						const absorbed = math.min(eff, shieldCur);
						// Convert absorbed back to raw damage budget consumed (avoid compounding multiplier twice)
						const rawConsumed = mult !== 0 ? absorbed / mult : absorbed;
						remaining = math.max(0, remaining - rawConsumed);
					}

					if (remaining > 0) {
						const hp = (ctx.world.get(e, ctx.C.Enemy.Health) as number) ?? 0;
						const newHp = math.max(0, hp - remaining);
						ctx.world.set(e, ctx.C.Enemy.Health, newHp);
						if (newHp <= 0) ctx.world.add(e, ctx.C.Tags.Dead);
					}
					// Track last hitter ownership for kill-credit
					if (ctx.world.has(tower, ctx.C.Tower.OwnerId)) {
						const owner = ctx.world.get(tower, ctx.C.Tower.OwnerId);
						if (owner !== undefined) ctx.world.set(e, ctx.C.Enemy.KillCreditOwnerId, owner);
					}
				}
				if (finalTargets.size() > 0) {
					ctx.world.set(tower, ctx.C.Attack.Event, { target: selected, targets: finalTargets });
				}

				cooldown.current = cooldown.max;
				ctx.world.set(tower, ctx.C.Attack.Cooldown, cooldown);
			}
		}
	}
}

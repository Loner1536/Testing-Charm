// Packages
import { type Entity, type World } from "@rbxts/jecs";

// Types
import type Components from "../../components";
import type * as Types from "@shared/types";

// Components
import { positionOnPath, advanceAlongPath } from "./path";

export default class EnemySystem {
	// Helpers
	private updateSimpleOrientation(ctx: Types.Core.Systems.Context, e: Entity, node: number, path: Vector2[]) {
		const endIdx = math.max(0, path.size() - 1);
		const i = math.clamp(node, 0, math.max(0, endIdx - 1));
		const a = path[i];
		const b = path[i + 1] ?? a;
		const dir = b.sub(a);
		if (dir.Magnitude > 1e-6) {
			ctx.world.set(e, ctx.C.Grid.Orientation, math.atan2(dir.Y, dir.X));
			ctx.world.set(e, ctx.C.Grid.MoveDir, dir);
		}
	}

	// Core
	public move(ctx: Types.Core.Systems.Context, dt: number) {
		if (ctx.path.size() < 2 && (!ctx.routes || ctx.routes.size() === 0)) return;
		for (const [e, speed, pathProg] of ctx.world
			.query(ctx.C.Enemy.Speed, ctx.C.Grid.PathProgress)
			.with(ctx.C.Tags.Enemy)) {
			const routeIndex1 = (ctx.world.get(e, ctx.C.Grid.PathIndex) as number | undefined) ?? 1;
			const routesCount = ctx.routes ? ctx.routes.size() : 0;
			const arrIdx = routesCount > 0 ? math.clamp(routeIndex1 - 1, 0, routesCount - 1) : 0;
			const pathToUse = ctx.routes && ctx.routes[arrIdx] ? ctx.routes[arrIdx] : ctx.path;
			if (pathToUse.size() < 2) {
				const pos = positionOnPath(pathToUse, 0, 0);
				ctx.world.set(e, ctx.C.Grid.World, pos);
				ctx.world.set(e, ctx.C.Grid.Grid, pos);
				this.updateSimpleOrientation(ctx, e, 0, pathToUse);
				continue;
			}
			if (speed === 0) {
				const pos = positionOnPath(pathToUse, pathProg.node, pathProg.progress);
				ctx.world.set(e, ctx.C.Grid.World, pos);
				ctx.world.set(e, ctx.C.Grid.Grid, pos);
				this.updateSimpleOrientation(ctx, e, pathProg.node, pathToUse);
				continue;
			}
			const distance = speed * dt;
			const step = advanceAlongPath(pathToUse, pathProg.node, pathProg.progress, distance);
			ctx.world.set(e, ctx.C.Grid.PathProgress, { node: step.node, progress: step.progress });
			ctx.world.set(e, ctx.C.Grid.World, step.position);
			ctx.world.set(e, ctx.C.Grid.Grid, step.position);
			if (step.reachedEnd) {
				// Capture remaining HP as leak damage before marking as dead
				const hpAtLeak = ctx.world.get(e, ctx.C.Enemy.Health) ?? 0;
				if (hpAtLeak > 0) ctx.world.set(e, ctx.C.Stats.LeakDamage, hpAtLeak);
				ctx.world.add(e, ctx.C.Tags.Completed);
				ctx.world.add(e, ctx.C.Tags.Dead);
				ctx.world.set(e, ctx.C.Enemy.Health, 0);
				continue;
			}
			this.updateSimpleOrientation(ctx, e, step.node, pathToUse);
		}
	}
	public spawner(ctx: Types.Core.Systems.Context, spawn: Types.Core.Enemy.SpawnConfig) {
		let acc = 0;
		return (dt: number) => {
			if (ctx.path.size() < 2) return;
			acc += dt * spawn.rate;
			while (acc >= 1) {
				acc -= 1;
				const e = ctx.world.entity();
				ctx.world.add(e, ctx.C.Tags.Enemy);
				ctx.world.set(e, ctx.C.Enemy.MaxHealth, spawn.health);
				ctx.world.set(e, ctx.C.Enemy.Health, spawn.health);
				ctx.world.set(e, ctx.C.Enemy.Speed, spawn.speed);
				ctx.world.set(e, ctx.C.Grid.PathProgress, { node: 0, progress: 0 });
				const pos = positionOnPath(ctx.path, 0, 0);
				ctx.world.set(e, ctx.C.Grid.Grid, pos);
				ctx.world.set(e, ctx.C.Grid.World, pos);
				ctx.world.set(e, ctx.C.Grid.SpawnPoint, pos);
				this.updateSimpleOrientation(ctx, e, 0, ctx.path);
			}
		};
	}
	public reconcilePredicted(world: World, C: Components) {
		for (const [e] of world.query(C.Enemy.PredictedHealth)) {
			if (!world.has(e, C.Tags.Predicted) && world.has(e, C.Enemy.Health)) {
				world.remove(e, C.Enemy.PredictedHealth);
			}
		}
	}
	public cleanupDead(ctx: Types.Core.Systems.Context) {
		for (const [e] of ctx.world.query(ctx.C.Tags.Dead).with(ctx.C.Tags.Enemy)) {
			const health = (ctx.world.get(e, ctx.C.Enemy.Health) as number) ?? 0;
			const isPredicted = ctx.world.has(e, ctx.C.Tags.Predicted);
			if (health <= 0 && !isPredicted) ctx.world.delete(e);
		}
	}
}

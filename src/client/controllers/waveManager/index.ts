// Services
import { Workspace, RunService } from "@rbxts/services";

// Packages
import { OnStart, Controller } from "@flamework/core";

// Dependencies
import StateManager from "../stateManager";

class EnemyVisual {
	constructor(
		public part: BasePart,
		public wpIndex: number,
	) {}
}

@Controller()
export default class EnemyManager implements OnStart {
	private visuals = new Map<string, EnemyVisual>();
	private waypoints: BasePart[] = [];
	private debug = true;

	constructor(private stateManager: StateManager) {}

	onStart() {
		this.waypoints = this.getWaypoints();

		// Animate enemies each render step

		// RunService.RenderStepped.Connect((dt) => this.animateEnemies(dt)); // TODO: uncomment when replecs work
	}

	private spawnEnemy(id: string, enemyState: { pathIndex: number; hp: number }) {
		if (!this.debug) return;

		const part = new Instance("Part");
		part.Anchored = true;
		part.CanCollide = false;
		part.Size = new Vector3(1, 1, 1);
		part.Color = Color3.fromRGB(0, 255, 0);
		part.Position = this.waypoints[enemyState.pathIndex]?.Position ?? Vector3.zero;
		part.Parent = Workspace;

		const visual = new EnemyVisual(part, enemyState.pathIndex);
		this.visuals.set(id, visual);
	}

	public updateEnemy(id: string, enemyState: { pathIndex: number; hp: number }) {
		const visual = this.visuals.get(id);
		if (visual) visual.wpIndex = enemyState.pathIndex;
	}

	private getWaypoints(): BasePart[] {
		const mapId = this.stateManager.waveData.state().mapId;
		const routeFolder = Workspace.FindFirstChild(mapId)?.FindFirstChild("route") as Folder;
		if (!routeFolder) return [];
		return routeFolder
			.GetChildren()
			.filter((p) => p.IsA("BasePart"))
			.sort((a, b) => tonumber(a.Name)! < tonumber(b.Name)!);
	}

	// TODO: Recreate this when I have replecs working

	// private animateEnemies(dt: number) {
	// 	for (const [id, visual] of this.visuals) {
	// 		const enemyState = this.stateManager.waveData.state().enemies.find((enemy) => enemy.id === id);
	// 		if (!enemyState) continue; // Enemy was removed

	// 		// Waypoints
	// 		if (this.waypoints.size() === 0) continue;
	// 		const currentIndex = visual.wpIndex;
	// 		const targetIndex = math.clamp(currentIndex, 0, this.waypoints.size() - 1);
	// 		const targetPos = this.waypoints[targetIndex].Position;

	// 		// Move exactly like server
	// 		const dir = targetPos.sub(visual.part.Position).Unit;
	// 		const speed = enemyState.speed;
	// 		const dist = speed * dt;
	// 		const nextPos =
	// 			targetPos.sub(visual.part.Position).Magnitude <= dist
	// 				? targetPos
	// 				: visual.part.Position.add(dir.mul(dist));

	// 		visual.part.Position = nextPos;

	// 		// If reached waypoint, increment index (simulate server)
	// 		if (nextPos === targetPos) {
	// 			visual.wpIndex = currentIndex + 1;
	// 			// Optionally, you can check server state here to reconcile
	// 			// visual.wpIndex = math.max(enemyState.pathIndex, visual.wpIndex);
	// 		}
	// 	}
	// }
}

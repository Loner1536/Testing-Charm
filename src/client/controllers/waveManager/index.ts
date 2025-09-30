// Services
import { Workspace, RunService, ReplicatedStorage } from "@rbxts/services";

// Packages
import { OnStart, Controller } from "@flamework/core";
import { observe } from "@rbxts/charm";

// Dependencies
import StateManager from "../stateManager";

@Controller()
export default class EnemyManager implements OnStart {
	private entities = new Map<string, { model: Model; debug: BasePart | undefined; pathIndex: number }>();
	private waypoints: BasePart[] = [];
	private debug = true;

	private templateModel!: Model;

	constructor(private stateManager: StateManager) {
		this.templateModel = ReplicatedStorage.WaitForChild("assets")
			.WaitForChild("models")
			.WaitForChild("enemies")
			.WaitForChild("test")
			.WaitForChild("itadori") as Model;
	}

	onStart() {
		this.waypoints = this.getWaypoints();

		observe(
			() => this.stateManager.waveData.state().enemies,
			(enemy, id) => {
				if (!enemy) return;

				if (!this.entities.has(id)) {
					this.spawnEnemy(id, enemy.pathIndex, enemy.speed);
				}
				const entity = this.entities.get(id);
				if (entity) {
				}

				return () => {
					if (this.debug) this.removeDebugPart(id);
					if (entity) {
						if (this.debug) entity.debug?.Destroy();

						entity.model.Destroy();
						this.entities.delete(id);
					}
				};
			},
		);

		RunService.RenderStepped.Connect((dt) => this.animateEnemies(dt));
	}

	private spawnEnemy(id: string, pathIndex: number, speed: number) {
		const currentWaypoint = this.waypoints[pathIndex];
		if (!currentWaypoint) return;

		const model = this.templateModel.Clone();

		// --- Determine position and orientation ---
		const verticalOffset = 0.9; // studs above the path
		const spawnPos = currentWaypoint.Position.add(new Vector3(0, verticalOffset, 0));

		// Look at next waypoint if exists, otherwise face same direction
		let lookTarget = spawnPos;
		if (pathIndex < this.waypoints.size() - 1) {
			lookTarget = this.waypoints[pathIndex + 1].Position.add(new Vector3(0, verticalOffset, 0));
		}

		const spawnCFrame = CFrame.lookAt(spawnPos, lookTarget);

		// --- Parent to Workspace folder ---
		let enemiesFolder = Workspace.FindFirstChild("Enemies") as Folder;
		if (!enemiesFolder) {
			enemiesFolder = new Instance("Folder");
			enemiesFolder.Name = "Enemies";
			enemiesFolder.Parent = Workspace;
		}
		model.Parent = enemiesFolder;

		// --- Apply initial CFrame ---
		model.PivotTo(spawnCFrame);

		// --- Optional debug part ---
		let debug: BasePart | undefined = undefined;
		if (this.debug) {
			debug = new Instance("Part");
			debug.Anchored = true;
			debug.CanCollide = false;
			debug.Size = new Vector3(1, 1, 1);
			debug.Color = Color3.fromRGB(0, 255, 0);
			debug.Position = spawnPos;
			debug.Parent = model.PrimaryPart || model;
		}

		this.entities.set(id, { model, debug, pathIndex });
	}

	private animateEnemies(dt: number) {
		const verticalOffset = 0.9; // studs above the path
		const rotationSpeed = 10; // radians per second for smooth turning

		for (const [id, entity] of this.entities) {
			const enemyState = this.stateManager.waveData.state().enemies.get(id);
			if (!enemyState) continue;

			let currentIndex = entity.pathIndex;
			if (currentIndex >= this.waypoints.size()) continue;

			const primaryPart = entity.model.PrimaryPart;
			if (!primaryPart) continue;

			// --- Determine current target position with vertical offset ---
			const currentWaypoint = this.waypoints[currentIndex];
			if (!currentWaypoint) continue;
			const targetPos = currentWaypoint.Position.add(new Vector3(0, verticalOffset, 0));

			// --- Movement toward current waypoint ---
			const toTarget = targetPos.sub(primaryPart.Position);
			const moveDistance = math.min(toTarget.Magnitude, enemyState.speed * dt);
			const nextPos = primaryPart.Position.add(toTarget.Unit.mul(moveDistance));

			// --- Determine next waypoint for rotation (lookahead) ---
			let lookTarget = targetPos;
			if (currentIndex < this.waypoints.size() - 1) {
				lookTarget = currentWaypoint.Position.add(new Vector3(0, verticalOffset, 0));
			}

			// --- Smooth rotation ---
			const desiredDir = lookTarget.sub(primaryPart.Position).Unit;
			const currentLook = primaryPart.CFrame.LookVector;

			// Calculate the angle between current look and desired direction
			const angle = math.acos(math.clamp(currentLook.Dot(desiredDir), -1, 1));
			const maxAngle = rotationSpeed * dt;
			const t = angle < maxAngle ? 1 : maxAngle / angle;

			// Lerp the look vector toward desired direction
			const newLook = currentLook.Lerp(desiredDir, t).Unit;

			// --- Apply movement + rotation ---
			entity.model.PivotTo(CFrame.lookAt(nextPos, nextPos.add(newLook)));

			// --- Update debug part if exists ---
			if (entity.debug) entity.debug.Position = nextPos;

			// --- Update path index if reached ---
			if (toTarget.Magnitude <= moveDistance) {
				entity.pathIndex = currentIndex + 1;
			}
		}
	}

	private removeDebugPart(id: string) {
		const entity = this.entities.get(id);
		if (entity?.debug) entity.debug.Destroy();
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
}

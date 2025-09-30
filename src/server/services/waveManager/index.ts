// Services
import { ServerStorage, Workspace, RunService, HttpService, Players } from "@rbxts/services";

// Packages
import { OnStart, Service } from "@flamework/core";
import { NetworkData } from "@shared/network";
import { Entity } from "@rbxts/jecs";

// Dependencies
import StateManager from "../stateManager";
import JecsManager from "../jecsManager";
import Object from "@rbxts/object-utils";

// Assets
const maps = ServerStorage.WaitForChild("assets").WaitForChild("models").WaitForChild("maps") as Folder;

type TeleportData = {
	type: "story" | "raid";
	id: string;
	act: number;
};

@Service()
export default class WaveManager implements OnStart {
	private getState: () => NetworkData.State.WaveData.Default;
	private enemies: Map<string, Entity> = new Map();
	private votes: Map<string, boolean> = new Map();
	private enemiesConnection!: RBXScriptConnection;
	private teleportData!: TeleportData;

	constructor(
		private stateManager: StateManager,
		private jecsManager: JecsManager,
	) {
		this.getState = this.stateManager.waveData.get;
	}

	onStart() {
		this.teleportData = { type: "story", id: "test", act: 1 };

		const map = maps.FindFirstChild(this.teleportData.id);
		if (!map) error(`Map ${this.teleportData.id} not found`);
		map.Clone().Parent = Workspace;

		this.stateManager.waveData.update((data) => {
			data.hpStocks = 3;
			data.type = this.teleportData.type;
			data.mapId = this.teleportData.id;
			data.act = this.teleportData.act;
			data.wave = 0;
			return data;
		});

		this.enemiesConnection = RunService.Heartbeat.Connect((dt) => this.updateEnemies(dt));
	}

	private startWave() {
		this.stateManager.waveData.update((data) => {
			data.vote = true;
			data.wave += 1;
			return data;
		});

		this.spawnWaveEnemies();
	}

	private endGame() {
		this.enemiesConnection.Disconnect();
	}

	private spawnWaveEnemies() {
		const world = this.jecsManager.world;
		const comps = this.jecsManager.components;
		const waypoints = this.getWaypoints();

		for (let i = 0; i < 2; i++) {
			const id = HttpService.GenerateGUID(false);
			const enemy = world.entity();

			// Tag and components
			world.add(enemy, comps.enemy);
			world.set(enemy, comps.health, 100);
			world.set(enemy, comps.predictedHP, 100);
			world.set(enemy, comps.pathIndex, 0);
			world.set(enemy, comps.position, waypoints[0]);
			world.set(enemy, comps.speed, 12);
			world.set(enemy, comps.enemyType, "itadori");

			this.stateManager.waveData.update((data) => {
				data.enemies.set(id, {
					hp: world.get(enemy, comps.health)!,
					speed: world.get(enemy, comps.speed)!,
					pathIndex: world.get(enemy, comps.pathIndex)!,
				});
				return data;
			});

			this.enemies.set(id, enemy);

			task.wait(0.2);
		}
	}

	/** Update all enemies along their path */
	private updateEnemies(dt: number) {
		const world = this.jecsManager.world;
		const comps = this.jecsManager.components;
		const waypoints = this.getWaypoints();

		for (const [id, enemy] of this.enemies) {
			const pos = world.get(enemy, comps.position);
			const pathIndex = world.get(enemy, comps.pathIndex);
			const speed = world.get(enemy, comps.speed);

			if (!pos || pathIndex === undefined || speed === undefined) continue;

			// Remove if reached the last waypoint
			if (pathIndex >= waypoints.size() - 1) {
				world.delete(enemy);
				this.enemies.delete(id);

				// Remove debug part if enabled
				if (this.jecsManager.debug) this.removeDebugPart(id);

				this.stateManager.waveData.update((data) => {
					if (data.hpStocks > 0) data.hpStocks -= 1;
					data.enemies.delete(id);

					return data;
				});

				continue;
			}

			const target = waypoints[pathIndex + 1];
			if (!target) continue;

			const dir = target.sub(pos).Unit;
			const dist = speed * dt;
			const nextPos = target.sub(pos).Magnitude <= dist ? target : pos.add(dir.mul(dist));

			world.set(enemy, comps.position, nextPos);

			if (nextPos === target) {
				world.set(enemy, comps.pathIndex, pathIndex + 1);
			}

			// Debug visualization
			if (this.jecsManager.debug) {
				if (!this.debugParts.has(id)) this.spawnDebugPart(id, nextPos);
				else this.updateDebugPart(id, nextPos);
			}
		}
	}

	/** Debug helpers */
	private debugParts: Map<string, BasePart> = new Map();

	private spawnDebugPart(id: string, position: Vector3) {
		const part = new Instance("Part");
		part.Anchored = true;
		part.CanCollide = false;
		part.Size = new Vector3(1, 1, 1);
		part.Color = Color3.fromRGB(255, 0, 0);
		part.Position = position;
		part.Parent = Workspace;
		this.debugParts.set(id, part);
	}

	private updateDebugPart(id: string, position: Vector3) {
		const part = this.debugParts.get(id);
		if (part) part.Position = position;
	}

	private removeDebugPart(id: string) {
		const part = this.debugParts.get(id);
		if (part) {
			part.Destroy();
			this.debugParts.delete(id);
		}
	}

	/** Get waypoints from map */
	private getWaypoints(): Vector3[] {
		const routeFolder = Workspace.WaitForChild(this.teleportData.id).WaitForChild("route") as Folder;
		const parts = routeFolder.GetChildren() as BasePart[];
		const sorted = parts.sort((a, b) => tonumber(a.Name)! < tonumber(b.Name)!);
		return sorted.map((p) => p.Position);
	}

	public network = {
		vote: (player: Player) => {
			if (this.votes.has(tostring(player.UserId))) return;
			print(`${player.Name} voted to start the wave`);
			this.votes.set(tostring(player.UserId), true);

			this.stateManager.waveData.update((data) => {
				data.votes = this.votes.size();
				return data;
			});

			if (this.votes.size() >= Players.GetPlayers().size()) {
				this.votes.clear();
				this.startWave();
			}
		},
	};
}

// Services
import { Workspace, ReplicatedStorage } from "@rbxts/services";

// Packages
import { OnStart, Controller } from "@flamework/core";
import Network from "@network/client";

// Dependencies
import StateManager from "../stateManager";

class EnemyVisual {
	constructor(
		public model: Model,
		public wpIndex: number,
	) {}
}

@Controller()
export default class EnemyManager implements OnStart {
	private visuals = new Map<string, EnemyVisual>();

	constructor(private stateManager: StateManager) {}

	onStart() {
		const waveData = this.stateManager.get("waveData");

		// waveData((state) => {
		// 	state.enemies.forEach((enemyState) => {
		// 		if (!this.visuals.has(enemyState.id)) {
		// 			this.spawnEnemy(enemyState);
		// 		} else {
		// 			this.updateEnemy(enemyState);
		// 		}
		// 	});

		// 	for (const [id, visual] of this.visuals) {
		// 		if (!state.enemies.find((e) => e.id === id)) {
		// 			visual.model.Destroy();
		// 			this.visuals.delete(id);
		// 		}
		// 	}
		// });

		// Network.Wave.start.on(() => this.spawnEnemy());
	}

	private spawnEnemy(enemyState: { id: string; type: string; wpIndex: number; hp: number }) {
		const template = ReplicatedStorage.WaitForChild("assets")
			.WaitForChild("models")
			.WaitForChild("enemies")
			.FindFirstChild(enemyState.type) as Model;

		const model = template.Clone();
		model.Parent = Workspace;

		const visual = new EnemyVisual(model, enemyState.wpIndex);
		this.visuals.set(enemyState.id, visual);
	}

	private getWaypoints() {
		const routeFolder = Workspace.WaitForChild("test").WaitForChild("route") as Folder;
		return routeFolder.GetChildren().sort((a, b) => tonumber(a.Name)! < tonumber(b.Name)!);
	}
}

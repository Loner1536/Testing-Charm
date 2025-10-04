// Services
import { Workspace } from "@rbxts/services";

// Types
import type * as Types from "@shared/types";

export default class Route {
	private config: Types.Core.Route.BuilderConfig;

	constructor(core: Types.Core.API, config: Types.Core.Route.BuilderConfig) {
		this.config = config;
	}

	public buildRoutesFromWorld(): Types.Core.Route.Info[] {
		const routes: Types.Core.Route.Info[] = [];

		const map = Workspace.FindFirstChild("Map") as Model;
		assert(map, "[Route] No Map model found in Workspace");

		const routeFolder = map.FindFirstChild("Route") as Folder;
		assert(routeFolder, "[Route] No Route folder found in Map");

		const spawnFolders = routeFolder.GetChildren().filter((c) => c.IsA("Folder")) as Folder[];

		for (const spawn of spawnFolders) {
			const routeModels = spawn.GetChildren().filter((c) => c.IsA("Model")) as Model[];

			const sortedModels = routeModels.sort((a, b) => {
				const aNum = tonumber(a.Name) || 0;
				const bNum = tonumber(b.Name) || 0;
				return aNum < bNum; // true if a should come before b
			});

			const routePositions: Vector3[] = [];
			for (const model of sortedModels) {
				const startPart = model.FindFirstChild("Start") as BasePart | undefined;
				const endPart = model.FindFirstChild("End") as BasePart | undefined;
				if (!startPart || !endPart) continue;

				if (routePositions.size() === 0 || routePositions[routePositions.size() - 1] !== startPart.Position) {
					routePositions.push(startPart.Position);
				}
				routePositions.push(endPart.Position);
			}

			assert(routePositions.size() > 1, `[Route] Spawn folder ${spawn.Name} has insufficient route points`);

			routes.push({
				name: spawn.Name,
				path: routePositions,
				models: sortedModels as Types.Core.Route.DefinedModel[],
			});
		}

		return routes;
	}

	public validateRoute(route: Types.Core.Route.Info): boolean {
		return route.path.size() >= 2;
	}
}

// Services
import { Workspace } from "@rbxts/services";

// Types
import type * as Types from "@shared/types";

export default class Route {
	private config: Types.Core.Route.BuilderConfig;

	constructor(
		config: Types.Core.Route.BuilderConfig,
		private coreDebugGetter: () => boolean,
	) {
		this.config = config;
	}

	private debug() {
		return this.coreDebugGetter();
	}

	public buildRoutesFromWorld(): Types.Core.Route.Info[] {
		const routes: Types.Core.Route.Info[] = [];

		const map = Workspace.FindFirstChild("Map") as Model;
		const route = map.FindFirstChild("Route") as Folder;

		const allRoutes = route.GetChildren() as Folder[];

		const tagged: Instance[] = [];
		allRoutes.forEach((folder) => {
			const children = folder.GetChildren();
			for (let i = 0; i < children.size(); i++) {
				tagged.push(children[i]);
			}
		});

		const pathModels: Types.Core.Route.DefinedModel[] = tagged.filter(
			(i): i is Types.Core.Route.DefinedModel =>
				i.IsA("Model") &&
				i.Parent !== undefined &&
				i.Parent!.IsA("Folder") &&
				i.FindFirstChild("Start") !== undefined &&
				i.FindFirstChild("Start")!.IsA("BasePart") &&
				i.FindFirstChild("End") !== undefined &&
				i.FindFirstChild("End")!.IsA("BasePart"),
		);

		assert(pathModels.size() === tagged.size(), "Some 'Route' tagged instances are not valid Route models.");
		assert(pathModels.size() > 0, "No valid Route models found.");

		if (this.debug()) print(`Found ${pathModels.size()} Route models, building routes...`);

		const routeGroups = this.groupModelsByRoute(pathModels);

		for (const [folder, models] of routeGroups) {
			const path = this.convertModelsToPath(models);
			if (path.size() > 0) {
				routes.push({
					name: folder.Name,
					path,
					models,
				});
			}
		}

		// Note: We don't assert equality with routeGroups.size() because degenerate
		// geometry could theoretically produce an empty path which we skip.
		assert(routes.size() > 0, "No routes were built from Route models.");

		return routes;
	}

	/**
	 * Groups an array of `RouteModel` instances by their route folder.
	 * Parent Folder is required and must be named exactly "1".."9".
	 */
	private groupModelsByRoute(models: Types.Core.Route.DefinedModel[]): Map<Folder, Types.Core.Route.DefinedModel[]> {
		const groups = new Map<Folder, Types.Core.Route.DefinedModel[]>();

		for (const model of models) {
			const parent = model.Parent;

			// Validate parent is Folder named 1..9
			assert(parent.IsA("Folder"), `Route model '${model.GetFullName()}' must be a child of a Folder.`);
			assert(
				parent.Name.match("^[1-9]$") !== undefined,
				`Route model '${model.GetFullName()}' parent Folder name must be "1".."9".`,
			);

			// Validate model name numeric 1..99 to match sort logic
			const num = tonumber(model.Name);
			assert(
				num !== undefined && math.floor(num) === num && num >= 1 && num <= 99,
				`Route model '${model.GetFullName()}' name must be an integer "1".."9" or "10".."99".`,
			);

			// Group by Folder instance (avoid collisions between separate Folders with same name)
			if (!groups.has(parent)) {
				groups.set(parent, []);
			}
			const arr = groups.get(parent)!;
			// Avoid duplicate insertion of the same Instance reference
			if (!arr.find((m) => m === model)) {
				arr.push(model);
			}
		}

		return groups;
	}

	/**
	 * Converts 3D Route models to a 2D path by:
	 * 1. Sorting models by position order (start to end)
	 * 2. Converting world positions to grid coordinates with proper scaling
	 */
	private convertModelsToPath(models: Types.Core.Route.DefinedModel[]): Vector2[] {
		assert(models.size() > 0, "No Route models provided for path conversion.");

		// Sort models to determine path order
		const sortedModels = this.sortModelsByPathOrder(models);

		// Calculate world bounds using only Start/End parts for determinism
		const worldBounds = this.calculateWorldBounds(sortedModels);

		// Build path using Start and End only for each model (deterministic)
		const path: Vector2[] = [];
		for (const model of sortedModels) {
			const start = model.FindFirstChild("Start");
			const endPart = model.FindFirstChild("End");
			assert(
				start !== undefined && start.IsA("BasePart") && endPart !== undefined && endPart.IsA("BasePart"),
				`Route model '${model.GetFullName()}' must contain BaseParts 'Start' and 'End'.`,
			);
			const startGrid = this.worldToGridScaled((start as BasePart).Position, worldBounds);
			const endGrid = this.worldToGridScaled((endPart as BasePart).Position, worldBounds);
			path.push(startGrid);
			path.push(endGrid);
		}

		// Remove duplicate consecutive points
		const cleanedPath = this.removeDuplicatePoints(path);

		return cleanedPath;
	}

	/**
	 * Sorts Route models by their intended order in the path
	 */
	private sortModelsByPathOrder(models: Types.Core.Route.DefinedModel[]): Types.Core.Route.DefinedModel[] {
		// Build (model, order)
		const withOrder = models.map((model) => {
			assert(model.Parent!.IsA("Folder"), `Route model '${model.GetFullName()}' must be a child of a Folder.`);

			// Parse numeric name directly and validate 1..99
			const num = tonumber(model.Name);
			assert(
				num !== undefined && math.floor(num) === num && num >= 1 && num <= 99,
				`Route model '${model.GetFullName()}' name must be an integer "1".."9" or "10".."99".`,
			);

			return { model, order: num };
		});

		// Deterministic sort; no assertions in comparator
		withOrder.sort((a, b) => {
			if (a.order !== b.order) return a.order < b.order;
			// Tie-break by full name for stable ordering
			return a.model.GetFullName() < b.model.GetFullName();
		});

		// Validate no duplicate orders within this route
		for (let i = 1; i < withOrder.size(); i++) {
			const prev = withOrder[i - 1];
			const curr = withOrder[i];
			if (curr.order === prev.order) {
				assert(
					false,
					`Route models '${prev.model.GetFullName()}' and '${curr.model.GetFullName()}' have the same order '${curr.order}'.`,
				);
			}
		}

		return withOrder.map((item) => item.model);
	}

	/**
	 * Calculates the world bounds of all Route models
	 */
	private calculateWorldBounds(models: Types.Core.Route.DefinedModel[]): { min: Vector3; max: Vector3 } {
		if (models.size() === 0) {
			return { min: new Vector3(0, 0, 0), max: new Vector3(0, 0, 0) };
		}

		let minX = math.huge,
			minY = math.huge,
			minZ = math.huge;
		let maxX = -math.huge,
			maxY = -math.huge,
			maxZ = -math.huge;

		for (const model of models) {
			const start = model.FindFirstChild("Start");
			const endPart = model.FindFirstChild("End");
			if (start !== undefined && start.IsA("BasePart")) {
				const pos = start.Position;
				minX = math.min(minX, pos.X);
				minY = math.min(minY, pos.Y);
				minZ = math.min(minZ, pos.Z);
				maxX = math.max(maxX, pos.X);
				maxY = math.max(maxY, pos.Y);
				maxZ = math.max(maxZ, pos.Z);
			}
			if (endPart !== undefined && endPart.IsA("BasePart")) {
				const pos = endPart.Position;
				minX = math.min(minX, pos.X);
				minY = math.min(minY, pos.Y);
				minZ = math.min(minZ, pos.Z);
				maxX = math.max(maxX, pos.X);
				maxY = math.max(maxY, pos.Y);
				maxZ = math.max(maxZ, pos.Z);
			}
		}

		return {
			min: new Vector3(minX, minY, minZ),
			max: new Vector3(maxX, maxY, maxZ),
		};
	}

	/**
	 * Converts 3D world position to 2D grid coordinates with proper scaling
	 * Maps the world bounds of Route models to fit within the ECS grid
	 */
	private worldToGridScaled(worldPos: Vector3, worldBounds: { min: Vector3; max: Vector3 }): Vector2 {
		const { width, height } = this.config.grid;

		// Calculate world dimensions
		const worldWidth = worldBounds.max.X - worldBounds.min.X;
		const worldHeight = worldBounds.max.Z - worldBounds.min.Z;

		// Avoid division by zero
		if (worldWidth <= 0 || worldHeight <= 0) {
			return new Vector2(0, 0);
		}

		// Normalize position within world bounds (0 to 1)
		const normalizedX = (worldPos.X - worldBounds.min.X) / worldWidth;
		const normalizedZ = (worldPos.Z - worldBounds.min.Z) / worldHeight;

		// Scale to grid coordinates with small padding to avoid edge issues
		const padding = 0.5; // Half a grid cell padding on each side
		const gridX = math.floor(normalizedX * (width - 2 * padding) + padding);
		const gridZ = math.floor(normalizedZ * (height - 2 * padding) + padding);

		// Ensure within bounds
		const clampedX = math.clamp(gridX, 0, width - 1);
		const clampedZ = math.clamp(gridZ, 0, height - 1);

		return new Vector2(clampedX, clampedZ);
	}

	/**
	 * Removes consecutive duplicate points from path
	 */
	private removeDuplicatePoints(path: Vector2[]): Vector2[] {
		if (path.size() <= 1) return path;

		const cleaned: Vector2[] = [path[0]];
		for (let i = 1; i < path.size(); i++) {
			const current = path[i];
			const previous = cleaned[cleaned.size() - 1];

			// Only add if different from previous point
			if (current.X !== previous.X || current.Y !== previous.Y) {
				cleaned.push(current);
			}
		}

		return cleaned;
	}

	/**
	 * Validates that a route has the minimum required structure
	 */
	public validateRoute(route: Types.Core.Route.Info): boolean {
		return route.path.size() >= 2; // Need at least start and end points
	}
}

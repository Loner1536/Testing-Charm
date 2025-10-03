// Types
import type * as Types from "@shared/types";

export default class Grid {
	public readonly tileSize: number;
	public readonly height: number;
	public readonly width: number;

	constructor(cfg: Types.Core.Grid.Config) {
		this.width = cfg.width;
		this.height = cfg.height;
		this.tileSize = cfg.tileSize ?? 1;
	}

	public inBounds(p: Vector2): boolean {
		return p.X >= 0 && p.Y >= 0 && p.X < this.width && p.Y < this.height;
	}

	public toWorld(p: Vector2): Vector2 {
		return new Vector2(p.X * this.tileSize + this.tileSize / 2, p.Y * this.tileSize + this.tileSize / 2);
	}

	public toGrid(p: Vector2): Vector2 {
		return new Vector2(math.floor(p.X / this.tileSize), math.floor(p.Y / this.tileSize));
	}
}

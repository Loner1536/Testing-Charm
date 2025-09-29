// Packages
import Replecs from "@rbxts/replecs";
import { world as World } from "@rbxts/jecs";

const world = World();

export function getWorld() {
	return world;
}

export default Replecs.create(world);

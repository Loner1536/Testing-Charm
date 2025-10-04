// Services
import { RunService } from "@rbxts/services";

// Packages
import Replecs from "@rbxts/replecs";

// Components
import getSim from ".";

// Create replicator singleton
let replicator: ReturnType<typeof Replecs.create> | undefined;

export default function getReplicator() {
	if (!replicator) {
		const sim = getSim();
		replicator = Replecs.create(sim.world);
	}
	return replicator;
}

// Packages
import Replecs from "@rbxts/replecs";

// Components
import getSim from ".";

// Create replicator singleton
let replicator: ReturnType<typeof Replecs.create> | undefined;

export default function getReplicator() {
	if (!replicator) {
		const sim = getSim(); // <-- server should own this
		replicator = Replecs.create(sim.world);
	}
	return replicator;
}

// Packages
import { OnStart, Service } from "@flamework/core";

// Classes
import WaveClass from "./class";

@Service()
export class DataStore implements OnStart {
	private startVotes: number = 0;

    onStart(): void {}
}

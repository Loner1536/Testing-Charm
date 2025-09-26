// Packages
import { OnStart, Service } from "@flamework/core";

@Service()
export class DataStore implements OnStart {
	private startVotes: number = 0;

	onStart(): void {}
}

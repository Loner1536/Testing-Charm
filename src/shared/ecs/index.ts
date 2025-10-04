// Services
import { RunService } from "@rbxts/services";

// Components
import start from "./start";
import Core from "./core";

let simSingleton: Core | undefined;

export default function getSim(): Core {
	if (!simSingleton) {
		simSingleton = new Core();
		if (RunService.IsRunning()) start(simSingleton);
	}
	return simSingleton;
}

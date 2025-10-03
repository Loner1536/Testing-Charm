// Components
import Core from "./core";

let simSingleton: Core | undefined;

export default function getSim(): Core {
	if (!simSingleton) {
		simSingleton = new Core();
	}
	return simSingleton;
}

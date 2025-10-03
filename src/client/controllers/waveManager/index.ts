// Packages
import { Controller, OnStart } from "@flamework/core";

// Types
import type * as Types from "@shared/types";

// Dependencies
import JecsManager from "../jecsManager";

@Controller()
export default class WaveManager implements OnStart {
	private sim: JecsManager["sim"];

	constructor(private jecsManager: JecsManager) {
		this.sim = jecsManager.sim;
	}

	onStart(): void {}
}

// Services
import { ContextActionService } from "@rbxts/services";

// Packages
import { Controller, OnStart } from "@flamework/core";
import Jabby from "@rbxts/jabby";

// Dependencies
import JecsManager from "../jecsManager";

@Controller()
export class JabbyController implements OnStart {
	private bound = false;
	private unbind?: () => void;

	constructor(public jecsManager: JecsManager) {}

	onStart() {
		this.jecsManager.sim.P.init("gameplay");

		const client = Jabby.obtain_client();

		const createWidget = (_: unknown, state: Enum.UserInputState) => {
			if (state !== Enum.UserInputState.Begin) {
				return;
			}
			client.spawn_app(client.apps.home);
		};

		ContextActionService.BindAction("Open Jabby Home", createWidget, false, Enum.KeyCode.F4);
	}
}

export default JabbyController;

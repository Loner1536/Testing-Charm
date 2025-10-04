// Services
import { ContextActionService } from "@rbxts/services";

// Packages
import { Controller, OnStart } from "@flamework/core";
import Jabby from "@rbxts/jabby";

// Components
import getSim from "@shared/ecs";

@Controller()
export class JabbyController implements OnStart {
	private client: ReturnType<typeof Jabby.obtain_client>;
	private bound = false;

	constructor() {
		const sim = getSim();

		sim.P.init("gameplay");

		this.client = Jabby.obtain_client();
	}

	onStart() {
		const createWidget = (_: unknown, state: Enum.UserInputState) => {
			if (state !== Enum.UserInputState.Begin) {
				return;
			}
			this.client.spawn_app(this.client.apps.home);
		};

		ContextActionService.BindAction("Open Jabby Home", createWidget, false, Enum.KeyCode.F4);
		this.bound = true;
	}

	public destroy() {
		if (!this.bound) return;

		this.client.unmount_all();
		ContextActionService.UnbindAction("Open Jabby Home");
		this.bound = false;
	}
}

export default JabbyController;

// Services
import { RunService, UserInputService } from "@rbxts/services";

// Packages
import { register, applets, set_check_function, obtain_client } from "@rbxts/jabby";

// Utility
import { Scheduler, CollectSystems, Initialize, type OrderedSystems } from "./utility/scheduler";

// Components
import getSim from "@shared/ecs";

function start_jabby() {
	const prefix = RunService.IsServer() ? "Server" : "Client";
	register({
		applet: applets.world,
		name: "World - " + prefix,
		configuration: {
			world: getSim().world,
		},
	});
	register({
		applet: applets.scheduler,
		name: "Scheduler - " + prefix,
		configuration: {
			scheduler: Scheduler,
		},
	});

	set_check_function((_player) => {
		// in future will check if player is allowed to use jabby and also if its the right environment
		return true;
	});

	if (RunService.IsClient()) {
		let mounted = false;
		const client = obtain_client();

		UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;
			if (input.KeyCode !== Enum.KeyCode.F4) return;

			if (mounted) {
				client.unmount_all();
			} else {
				client.spawn_app(client.apps.home);
				mounted = true;
			}
		});
	}
}

function start(systems_order: OrderedSystems) {
	start_jabby();
	const events = CollectSystems();
	Initialize(events, systems_order);
}

export default start;

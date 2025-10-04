// Services
import { RunService, UserInputService } from "@rbxts/services";

// Packages
import { register, applets, set_check_function, obtain_client } from "@rbxts/jabby";

// Types
import type * as Types from "@shared/types";

function start_jabby(sim: Types.Core.API) {
	const prefix = RunService.IsServer() ? "Server" : "Client";
	register({
		applet: applets.world,
		name: "World - " + prefix,
		configuration: {
			world: sim.world,
		},
	});
	register({
		applet: applets.scheduler,
		name: "Scheduler - " + prefix,
		configuration: {
			scheduler: sim.U.Scheduler.instance,
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

function start(sim: Types.Core.API) {
	if (!RunService.IsRunning()) return;

	start_jabby(sim);

	const events = sim.U.Scheduler.collectSystems();
	sim.U.Scheduler.initialize(events);
}

export default start;

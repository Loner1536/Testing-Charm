// Packages
import { Entity, pair } from "@rbxts/jecs";
import type { SystemId } from "@rbxts/jabby/out/jabby/modules/types";
import { scheduler } from "@rbxts/jabby";

// Roblox
import { RunService } from "@rbxts/services";

// Sim
import getSim from "@shared/ecs";

const sim = getSim();
const world = sim.world;

const HIDDEN = world.entity();
const DEPENDS_ON = world.entity();
const PHASE = world.entity();

const SYSTEM = world.component<{ name: string; callback: () => void; group?: string }>();
const EVENT = world.component<unknown>();

const POST_SIMULATION = world.entity();
const PRE_SIMULATION = world.entity();
const PRE_ANIMATION = world.entity();
const PRE_RENDER = world.entity();
const HEARBEAT = world.entity();

world.add(PRE_RENDER, PHASE);
world.set(PRE_RENDER, EVENT, RunService.PreRender);

world.add(HEARBEAT, PHASE);
world.set(HEARBEAT, EVENT, RunService.Heartbeat);

world.add(PRE_ANIMATION, PHASE);
world.set(PRE_ANIMATION, EVENT, RunService.PreAnimation);

world.add(PRE_SIMULATION, PHASE);
world.set(PRE_SIMULATION, EVENT, RunService.PreSimulation);

world.add(POST_SIMULATION, PHASE);
world.set(POST_SIMULATION, EVENT, RunService.PostSimulation);

const StepPhases = {
	Hearbeat: HEARBEAT,
	PreRender: PRE_RENDER,
	PreAnimation: PRE_ANIMATION,
	PreSimulation: PRE_SIMULATION,
	PostSimulation: POST_SIMULATION,
};

let CurrentSystem: System | undefined;

const SCHEDULER = scheduler.create();

function Run(...args: unknown[]) {
	if (CurrentSystem?.id !== undefined) {
		SCHEDULER.run(CurrentSystem.id, CurrentSystem.callback, ...args);
	} else {
		CurrentSystem?.callback(...args);
	}
}

function ConnectEvent(event: unknown, callback: (...args: unknown[]) => void): RBXScriptConnection {
	if (typeIs(event, "RBXScriptSignal")) {
		return event.Connect(callback);
	} else if (typeIs(event, "table") && "Connect" in event) {
		return (event as { Connect: (cb: (...args: unknown[]) => void) => RBXScriptConnection }).Connect(callback);
	} else if (typeIs(event, "table") && "connect" in event) {
		return (event as { connect: (cb: (...args: unknown[]) => void) => RBXScriptConnection }).connect(callback);
	} else if (typeIs(event, "table") && "subscribe" in event) {
		return (event as { subscribe: (cb: (...args: unknown[]) => void) => RBXScriptConnection }).subscribe(callback);
	} else {
		throw "Event-like object does not have a supported connect method.";
	}
}

export type OrderedSystems = Array<string | ((...args: unknown[]) => void)>;

type System = {
	callback: (...args: unknown[]) => void;
	name: string;
	id?: SystemId; // Updated to use the branded SystemId type
};

type Systems = System[];

type EventMap = Map<unknown, Systems>;

function Initialize(events: EventMap, orderTable?: OrderedSystems): () => void {
	const connections = new Map<unknown, RBXScriptConnection>();

	if (orderTable) {
		const oldEvents = events;
		events = new Map();

		oldEvents.forEach((systems, event) => {
			const ordered = [...systems];
			ordered.sort((a, b) => {
				const aOrder = orderTable.indexOf(a.callback) || orderTable.indexOf("__other__") || 0;
				const bOrder = orderTable.indexOf(b.callback) || orderTable.indexOf("__other__") || 0;
				return aOrder < bOrder;
			});
			events.set(event, ordered);
		});
	}

	events.forEach((systems, event) => {
		if (!event) return;

		const eventName = tostring(event);
		const connection = ConnectEvent(event, (...args: unknown[]) => {
			debug.profilebegin(`JECS - ${eventName}`);
			for (const system of systems) {
				CurrentSystem = system;
				debug.profilebegin(`JECS - ${system.name}`);
				Run(...args);
				debug.profileend();
			}
			debug.profileend();
		});
		connections.set(event, connection);
	});

	return () => {
		connections.forEach((connection) => connection.Disconnect());
	};
}

function CollectSystemsUnderEventRecursive(systems: Systems, phase: Entity) {
	const depends = pair(DEPENDS_ON, phase); // Use Jecs.pair for dependencies
	const phaseHidden = world.has(phase, HIDDEN);

	for (const [systemId, system] of world.query(SYSTEM).with(depends).iter()) {
		const systemEntry: System = {
			name: system.name,
			callback: system.callback,
		};

		const hidden = phaseHidden || world.has(systemId, HIDDEN);
		if (!hidden) {
			systemEntry.id = SCHEDULER.register_system({
				name: system.name,
				phase: system.group || "main",
			});
		}
		systems.push(systemEntry);
	}

	for (const [after] of world.query(PHASE).with(depends).iter()) {
		CollectSystemsUnderEventRecursive(systems, after);
	}
}

function CollectSystemsUnderEvent(event: Entity): Systems {
	const systems: Systems = [];
	CollectSystemsUnderEventRecursive(systems, event);
	return systems;
}

function CollectSystems(): EventMap {
	const events = new Map<unknown, Systems>();
	for (const [phase, event] of world.query(EVENT).with(PHASE).iter()) {
		events.set(event, CollectSystemsUnderEvent(phase));
	}
	return events;
}

function Phase(event?: unknown, after?: Entity, hidden?: boolean): Entity {
	const phase = world.entity();
	world.add(phase, PHASE);

	if (after) {
		const dependency = pair(DEPENDS_ON, after); // Use Jecs.pair for dependencies
		world.add(phase, dependency);
	}
	if (event) {
		world.set(phase, EVENT, event);
	}
	if (hidden) {
		world.add(phase, HIDDEN);
	}

	return phase;
}

function System(callback: (...args: unknown[]) => void, phase?: Entity, group?: string, hidden?: boolean): Entity {
	const system = world.entity();
	const name = debug.info(callback, "n")[0] || "Unnamed"; // Extract the first value from LuaTuple
	world.set(system, SYSTEM, {
		name: name,
		callback: callback,
		group: group,
	});

	phase = phase || HEARBEAT;
	if (hidden) {
		world.add(system, HIDDEN);
	}

	const dependency = pair(DEPENDS_ON, phase);
	world.add(system, dependency);

	return system;
}

export { StepPhases, Initialize, CollectSystems, System, Phase, SCHEDULER as Scheduler };

// Services
import { RunService } from "@rbxts/services";

// Types
import type * as Types from "@shared/types";

// Packages
import { Entity, pair } from "@rbxts/jecs";
import { scheduler } from "@rbxts/jabby";

export default class Schedulers {
	private dependsOnEntity: Entity;
	private hiddenEntity: Entity;
	private phaseEntity: Entity;

	private systemEntity: Entity;
	private eventEntity: Entity;

	private postSimulationEntity: Entity;
	private preSimulationEntity: Entity;
	private preAnimationEntity: Entity;
	private preRenderEntity: Entity;
	private heartbeatEntity: Entity;

	private currentSystem: Types.Core.Utility.Scheduler.System | undefined;
	public instance = scheduler.create();

	public stepPhases = {} as Record<string, Entity>;

	constructor(public sim: Types.Core.API) {
		this.dependsOnEntity = this.sim.world.entity();
		this.hiddenEntity = this.sim.world.entity();
		this.phaseEntity = this.sim.world.entity();

		this.systemEntity = this.sim.world.component<{ name: string; callback: () => void; group?: string }>();
		this.eventEntity = this.sim.world.component<unknown>();

		this.postSimulationEntity = this.sim.world.entity();
		this.preSimulationEntity = this.sim.world.entity();
		this.preAnimationEntity = this.sim.world.entity();
		this.preRenderEntity = this.sim.world.entity();
		this.heartbeatEntity = this.sim.world.entity();

		this.setupPhases();
	}

	private setupPhases() {
		const phaseMap: [Entity, RBXScriptSignal][] = [
			[this.preRenderEntity, RunService.PreRender],
			[this.heartbeatEntity, RunService.Heartbeat],
			[this.preAnimationEntity, RunService.PreAnimation],
			[this.preSimulationEntity, RunService.PreSimulation],
			[this.postSimulationEntity, RunService.PostSimulation],
		];

		for (const [phaseEntity, event] of phaseMap) {
			this.sim.world.add(phaseEntity, this.phaseEntity);
			this.sim.world.set(phaseEntity, this.eventEntity, event);
		}

		this.stepPhases = {
			heartbeat: this.heartbeatEntity,
			preRender: this.preRenderEntity,
			preAnimation: this.preAnimationEntity,
			preSimulation: this.preSimulationEntity,
			postSimulation: this.postSimulationEntity,
		};
	}

	private run(...args: unknown[]) {
		if (this.currentSystem?.id !== undefined) {
			this.instance.run(this.currentSystem.id, this.currentSystem.callback, ...args);
		} else {
			this.currentSystem?.callback(...args);
		}
	}

	private connectEvent(event: unknown, callback: (...args: unknown[]) => void): RBXScriptConnection {
		if (typeIs(event, "RBXScriptSignal")) {
			return event.Connect(callback);
		} else if (typeIs(event, "table") && "Connect" in event) {
			return (event as { Connect: (cb: (...args: unknown[]) => void) => RBXScriptConnection }).Connect(callback);
		} else if (typeIs(event, "table") && "connect" in event) {
			return (event as { connect: (cb: (...args: unknown[]) => void) => RBXScriptConnection }).connect(callback);
		} else if (typeIs(event, "table") && "subscribe" in event) {
			return (event as { subscribe: (cb: (...args: unknown[]) => void) => RBXScriptConnection }).subscribe(
				callback,
			);
		} else {
			throw "Event-like object does not have a supported connect method.";
		}
	}

	public initialize(
		events: Types.Core.Utility.Scheduler.EventMap,
		orderTable?: Types.Core.Utility.Scheduler.OrderedSystems,
	): () => void {
		const connections = new Map<unknown, RBXScriptConnection>();

		if (orderTable) {
			const oldEvents = events;
			events = new Map();

			oldEvents.forEach((systems, event) => {
				const ordered = [...systems];

				ordered.sort((a, b) => {
					const aOrder =
						orderTable.indexOf(a.callback) !== -1
							? orderTable.indexOf(a.callback)
							: orderTable.indexOf("__other__") !== -1
								? orderTable.indexOf("__other__")
								: 0;
					const bOrder =
						orderTable.indexOf(b.callback) !== -1
							? orderTable.indexOf(b.callback)
							: orderTable.indexOf("__other__") !== -1
								? orderTable.indexOf("__other__")
								: 0;
					return aOrder > bOrder;
				});

				events.set(event, ordered);
			});
		}

		events.forEach((systems, event) => {
			if (!event) return;

			const eventName = tostring(event);
			const connection = this.connectEvent(event, (...args: unknown[]) => {
				debug.profilebegin(`JECS - ${eventName}`);
				for (const system of systems) {
					this.currentSystem = system;
					debug.profilebegin(`JECS - ${system.name}`);
					this.run(...args);
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

	private collectSystemsUnderEventRecursive(systems: Types.Core.Utility.Scheduler.Systems, phaseEntity: Entity) {
		const depends = pair(this.dependsOnEntity, phaseEntity);
		const phaseHidden = this.sim.world.has(phaseEntity, this.hiddenEntity);

		for (const [systemId, system] of this.sim.world.query(this.systemEntity).with(depends).iter()) {
			const comp = system as { name: string; callback: (...args: unknown[]) => void; group?: string };

			const systemEntry: Types.Core.Utility.Scheduler.System = {
				name: comp.name,
				callback: comp.callback,
				group: comp.group,
			};

			const hidden = phaseHidden || this.sim.world.has(systemId, this.hiddenEntity);
			if (!hidden) {
				systemEntry.id = this.instance.register_system({
					name: comp.name,
					phase: comp.group || "main",
				});
			}
			systems.push(systemEntry);
		}

		for (const [afterEntity] of this.sim.world.query(this.phaseEntity).with(depends).iter()) {
			this.collectSystemsUnderEventRecursive(systems, afterEntity);
		}
	}

	public collectSystemsUnderEvent(eventEntity: Entity): Types.Core.Utility.Scheduler.Systems {
		const systems: Types.Core.Utility.Scheduler.Systems = [];
		this.collectSystemsUnderEventRecursive(systems, eventEntity);
		return systems;
	}

	public collectSystems(): Types.Core.Utility.Scheduler.EventMap {
		const events = new Map<unknown, Types.Core.Utility.Scheduler.Systems>();
		for (const [phaseEntity, eventEntity] of this.sim.world.query(this.eventEntity).with(this.phaseEntity).iter()) {
			events.set(eventEntity, this.collectSystemsUnderEvent(phaseEntity));
		}
		return events;
	}

	public phase(event?: unknown, afterEntity?: Entity, hidden?: boolean): Entity {
		const phaseEntity = this.sim.world.entity();
		this.sim.world.add(phaseEntity, this.phaseEntity);

		if (afterEntity) {
			const dependency = pair(this.dependsOnEntity, afterEntity);
			this.sim.world.add(phaseEntity, dependency);
		}
		if (event) this.sim.world.set(phaseEntity, this.eventEntity, event);
		if (hidden) this.sim.world.add(phaseEntity, this.hiddenEntity);

		return phaseEntity;
	}

	public system(
		callback: (...args: unknown[]) => void,
		phaseEntity?: Entity,
		group?: string,
		hidden?: boolean,
	): Entity {
		const systemEntity = this.sim.world.entity();
		// Avoid debug.info here — it can hang!
		const name = "System_" + tostring(systemEntity);

		this.sim.world.set(systemEntity, this.systemEntity, {
			name,
			callback,
			group,
		});

		phaseEntity = phaseEntity || this.heartbeatEntity;
		if (hidden) this.sim.world.add(systemEntity, this.hiddenEntity);

		const dependency = pair(this.dependsOnEntity, phaseEntity);
		this.sim.world.add(systemEntity, dependency);

		return systemEntity;
	}
}

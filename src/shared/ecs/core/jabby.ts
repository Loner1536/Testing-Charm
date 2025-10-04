// Services
import { RunService, Workspace, Stats } from "@rbxts/services";

// Types
import type { Scheduler as JabbyScheduler, SystemId } from "@rbxts/jabby/out/jabby/modules/types";
import type { World } from "@rbxts/jecs";

// Packages
import { broadcast_server, applets, register, scheduler } from "@rbxts/jabby";

export default class JabbyProfiler {
	private scheduler?: JabbyScheduler;
	private systems = new Map<string, number>();
	private initialized = false;
	private worldRegistered = false;
	private label = "";
	private warned = false;
	private metricsConn?: RBXScriptConnection;
	private metricsAccum = 0;

	public init(label: string) {
		this.label = label;
		if (this.initialized) return;
		this.initialized = true;

		this.scheduler = scheduler.create();

		register({
			name: `${this.label}:scheduler`,
			applet: applets.scheduler!,
			configuration: { scheduler: this.scheduler! },
		});

		if (RunService.IsServer()) {
			broadcast_server?.();
		}
	}

	/**
	 * Register a world once. Safe no-op if already registered or Jabby missing.
	 */
	public registerWorld(world: World) {
		if (this.worldRegistered) {
			print("World already registered");
			return;
		}
		this.worldRegistered = true;

		register!({
			name: `${this.label}:world`,
			applet: applets.world!,
			configuration: { world },
		});
		broadcast_server?.();
	}

	/** Ensure (and cache) a system id for the given name/phase pair. */
	public ensureSystem(name: string, phase?: string): number | undefined {
		if (!this.scheduler) return undefined;
		const key = `${this.label}.${name}`;
		const existing = this.systems.get(key);
		if (existing !== undefined) return existing;
		const [ok, id] = pcall(() => this.scheduler!.register_system({ name: key, phase, paused: false }));
		if (ok && typeOf(id) === "number") {
			this.systems.set(key, id);
			return id;
		}
		if (!this.warned && RunService.IsStudio()) {
			this.warned = true;
			warn(`[JabbyProfiler] Failed to register system '${key}'.`);
		}
		return undefined;
	}

	/** Run a profiled system function; falls back to direct execution if profiling unavailable. */
	public run(id: number | undefined, fn: () => void) {
		if (!id || !this.scheduler) return fn();
		const [ok] = pcall(() => this.scheduler!.run(id as SystemId, fn));
		if (!ok) fn();
	}

	/** Convenience one-off wrapper that ensures the system then profiles the call. */
	public profile(name: string, phase: string | undefined, fn: () => void) {
		const id = this.ensureSystem(name, phase);
		this.run(id, fn);
	}

	/**
	 * Start a tiny observer that periodically updates a scheduler system name with memory/instance counters.
	 * Shows up in the Scheduler applet so you can spot leaks over time without a custom UI.
	 */
	public startMetricsObserver(intervalSec = 2, extra?: () => string): () => void {
		// Only once per VM
		if (this.metricsConn) return () => this.stopMetricsObserver();
		// Need a scheduler to surface in the applet
		if (!this.scheduler) return () => {};
		const id = this.ensureSystem("metrics", "diagnostic");
		if (!id) return () => {};
		this.metricsAccum = 0;
		this.metricsConn = RunService.Heartbeat.Connect((dt) => {
			this.metricsAccum += dt;
			if (this.metricsAccum < intervalSec) return;
			this.metricsAccum = 0;
			// Sample memory
			const [okMem, totalMb] = pcall(() => Stats.GetTotalMemoryUsageMb());
			const memStr = okMem && typeOf(totalMb) === "number" ? `${math.floor((totalMb as number) + 0.5)}MB` : "?";
			// Sample visuals instance count (cheap folder-only scan)
			const vis = Workspace.FindFirstChild("ECSVisuals");
			let visCount = 0;
			if (vis) {
				const children = (vis as Instance).GetDescendants();
				visCount = children.size();
			}
			// Update system label (allow caller to append extra counters like pool sizes)
			pcall(() =>
				this.scheduler!.set_system_data(id as SystemId, {
					name: `${this.label}.metrics inst=${visCount} mem=${memStr}${extra ? " " + extra() : ""}`,
					phase: "diagnostic",
				}),
			);
		});
		return () => this.stopMetricsObserver();
	}

	private stopMetricsObserver() {
		this.metricsConn?.Disconnect();
		this.metricsConn = undefined;
	}
}

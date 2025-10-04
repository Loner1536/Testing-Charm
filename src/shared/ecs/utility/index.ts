// Types
import type * as Types from "@shared/types";

// Utility
import EntitySharer from "./add_shared";
import EntityNamer from "./add_names";
import Schedulers from "./schedulers";
import Observers from "./observers";
import Interval from "./interval";
import RefManager from "./ref";

export default class Utility {
	public Scheduler: Schedulers;
	public Sharer: EntitySharer;
	public Namer: EntityNamer;
	public Refs: RefManager;

	constructor(public sim: Types.Core.API) {
		this.Scheduler = new Schedulers(this.sim);
		this.Sharer = new EntitySharer(this.sim);
		this.Namer = new EntityNamer(this.sim);
		this.Refs = new RefManager(this.sim);
	}

	public observer() {
		return new Observers(this.sim);
	}

	public interval(seconds: number) {
		const interval = new Interval(seconds);
		return () => interval.tick();
	}
}

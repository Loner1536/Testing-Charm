export default class Interval {
	private pin: number | undefined;

	constructor(private intervalSeconds: number) {}

	public tick(): boolean {
		if (this.pin === undefined) this.pin = os.clock();

		const elapsed = os.clock() - this.pin > this.intervalSeconds;
		if (elapsed) this.pin = os.clock();

		return elapsed;
	}
}

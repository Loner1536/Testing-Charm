export function interval(s: number): () => boolean {
	let pin: number | undefined;

	return (): boolean => {
		if (pin === undefined) pin = os.clock();

		const elapsed = os.clock() - pin > s;
		if (elapsed) pin = os.clock();

		return elapsed;
	};
}

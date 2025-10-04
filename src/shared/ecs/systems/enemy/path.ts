export default class Path3D {
	private EPS = 1e-6;

	private lengthOfSegment(a: Vector3, b: Vector3): number {
		return b.sub(a).Magnitude;
	}

	private clampNodeIndex(path: Vector3[], idx: number): number {
		return math.clamp(idx, 0, math.max(0, path.size() - 1));
	}

	/**
	 * Advance along the path by `distance` starting at (node, progress)
	 * Returns updated node, progress, exact 3D position, and whether the end is reached
	 */
	public advance(
		path: Vector3[],
		node: number,
		progress: number,
		distance: number,
	): { node: number; progress: number; position: Vector3; reachedEnd: boolean } {
		if (path.size() === 0) return { node: 0, progress: 0, position: new Vector3(), reachedEnd: true };

		let currentNode = this.clampNodeIndex(path, node);
		let currentProgress = math.clamp(progress, 0, 1);
		let remaining = distance;

		// Loop until remaining distance is consumed or path end reached
		while (remaining > this.EPS && currentNode < path.size() - 1) {
			const a = path[currentNode];
			const b = path[currentNode + 1];
			const segLen = this.lengthOfSegment(a, b);

			if (segLen <= this.EPS) {
				// Skip zero-length segments
				currentNode += 1;
				currentProgress = 0;
				continue;
			}

			const segRemaining = segLen * (1 - currentProgress);

			if (remaining < segRemaining) {
				// Land inside current segment
				currentProgress += remaining / segLen;
				const pos = a.add(b.sub(a).mul(currentProgress));
				return { node: currentNode, progress: currentProgress, position: pos, reachedEnd: false };
			}

			// Consume the segment and continue
			remaining -= segRemaining;
			currentNode += 1;
			currentProgress = 0;
		}

		// Reached the last node
		const lastPos = path[path.size() - 1];
		return { node: path.size() - 1, progress: 1, position: lastPos, reachedEnd: true };
	}

	/** Get position on a given path at (node, progress) */
	public position(path: Vector3[], node: number, progress: number): Vector3 {
		const idx = this.clampNodeIndex(path, node);
		if (path.size() === 0) return new Vector3();
		if (idx >= path.size() - 1) return path[path.size() - 1];

		const a = path[idx];
		const b = path[idx + 1];
		const segLen = this.lengthOfSegment(a, b);
		if (segLen <= this.EPS) return a;

		const t = math.clamp(progress, 0, 1);
		return a.add(b.sub(a).mul(t));
	}
}

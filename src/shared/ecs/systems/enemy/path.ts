const EPS = 1e-6;

export function lengthOfSegment(a: Vector2, b: Vector2): number {
	return b.sub(a).Magnitude;
}

export function clampNodeIndex(path: Vector2[], idx: number): number {
	return math.clamp(idx, 0, math.max(0, path.size() - 1));
}

export function advanceAlongPath(
	path: Vector2[],
	node: number,
	progress: number,
	distance: number,
): { node: number; progress: number; position: Vector2; reachedEnd: boolean } {
	if (path.size() <= 0) {
		return { node: 0, progress: 0, position: new Vector2(0, 0), reachedEnd: true };
	}

	let currentNode = clampNodeIndex(path, node);
	let currentProgress = math.clamp(progress, 0, 1);
	let remaining = distance;

	// Already at or past last node
	if (currentNode >= path.size() - 1) {
		return { node: path.size() - 1, progress: 1, position: path[path.size() - 1], reachedEnd: true };
	}

	// Not moving: return current interpolated position
	if (remaining <= EPS) {
		const a = path[currentNode];
		const b = path[currentNode + 1];
		const segLen = lengthOfSegment(a, b);
		const pos = segLen > EPS ? a.add(b.sub(a).mul(currentProgress)) : a;
		return { node: currentNode, progress: currentProgress, position: pos, reachedEnd: false };
	}

	while (remaining > 0 && currentNode < path.size() - 1) {
		const a = path[currentNode];
		const b = path[currentNode + 1];
		const segLen = lengthOfSegment(a, b);

		if (segLen <= EPS) {
			// Skip zero-length segment
			currentNode += 1;
			currentProgress = 0;
			continue;
		}

		const segRemaining = segLen * (1 - currentProgress);

		if (remaining < segRemaining - EPS) {
			// Land inside current segment
			currentProgress += remaining / segLen;
			const pos = a.add(b.sub(a).mul(currentProgress));
			return { node: currentNode, progress: currentProgress, position: pos, reachedEnd: false };
		}

		// Consume this segment and continue
		remaining -= segRemaining;
		currentNode += 1;
		currentProgress = 0;

		// Landed exactly on a node with no remaining distance
		if (remaining <= EPS) {
			if (currentNode >= path.size() - 1) {
				return { node: path.size() - 1, progress: 1, position: path[path.size() - 1], reachedEnd: true };
			}
			return { node: currentNode, progress: 0, position: path[currentNode], reachedEnd: false };
		}
	}

	// Reached end of path
	return { node: path.size() - 1, progress: 1, position: path[path.size() - 1], reachedEnd: true };
}

export function positionOnPath(path: Vector2[], node: number, progress: number): Vector2 {
	const idx = clampNodeIndex(path, node);
	if (path.size() === 0) return new Vector2(0, 0);
	if (idx >= path.size() - 1) return path[path.size() - 1];

	const a = path[idx];
	const b = path[idx + 1];
	const segLen = lengthOfSegment(a, b);
	if (segLen <= EPS) return a; // avoid NaN from Unit on zero-length segments
	const t = math.clamp(progress, 0, 1);
	return a.add(b.sub(a).mul(t));
}

export function advanceAlongPathBackward(
	path: Vector2[],
	node: number,
	progress: number,
	distance: number,
): { node: number; progress: number; position: Vector2; reachedStart: boolean } {
	const n = path.size();
	if (n <= 0) return { node: 0, progress: 0, position: new Vector2(0, 0), reachedStart: true };

	// Clamp inputs
	let currNode = clampNodeIndex(path, node);
	let currProg = math.clamp(progress, 0, 1);
	let remaining = distance;

	// If we're at or before the start already
	if (currNode <= 0 && currProg <= EPS) {
		return { node: 0, progress: 0, position: path[0], reachedStart: true };
	}

	// Not moving
	if (remaining <= EPS) {
		const a = path[currNode];
		const b = currNode < n - 1 ? path[currNode + 1] : a;
		const segLen = lengthOfSegment(a, b);
		const pos = segLen > EPS ? a.add(b.sub(a).mul(currProg)) : a;
		return { node: currNode, progress: currProg, position: pos, reachedStart: false };
	}

	while (remaining > 0) {
		// If we're past the last valid forward segment, snap to last segment
		if (currNode >= n - 1) {
			currNode = n - 2;
			currProg = 1;
		}

		const a = path[currNode];
		const b = path[currNode + 1];
		const segLen = lengthOfSegment(a, b);

		if (segLen <= EPS) {
			// Skip zero-length forward segment by moving to previous
			if (currNode <= 0) {
				return { node: 0, progress: 0, position: path[0], reachedStart: true };
			}
			currNode -= 1;
			currProg = 1;
			continue;
		}

		// Distance available going backward within current segment up to its start (node)
		const segBackAvailable = segLen * currProg;

		if (remaining < segBackAvailable - EPS) {
			// Land inside current segment by decreasing progress
			currProg -= remaining / segLen;
			const pos = a.add(b.sub(a).mul(currProg));
			return { node: currNode, progress: currProg, position: pos, reachedStart: false };
		}

		// Consume this segment entirely and continue into previous segment
		remaining -= segBackAvailable;
		// Land exactly on node boundary
		currProg = 0;
		const posAtNode = a;
		// If no remaining distance, report exact node with progress 0
		if (remaining <= EPS) {
			const reachedStart = currNode <= 0;
			const reportNode = math.max(0, currNode);
			return { node: reportNode, progress: 0, position: posAtNode, reachedStart };
		}

		// Move to previous segment
		if (currNode <= 0) {
			// We tried to go past start
			return { node: 0, progress: 0, position: path[0], reachedStart: true };
		}
		currNode -= 1;
		currProg = 1; // at the end of the previous segment when viewed forward
	}

	// If we exit loop (shouldn't), return current state
	const a2 = path[currNode];
	const b2 = currNode < n - 1 ? path[currNode + 1] : a2;
	const segLen2 = lengthOfSegment(a2, b2);
	const pos2 = segLen2 > EPS ? a2.add(b2.sub(a2).mul(currProg)) : a2;
	return { node: currNode, progress: currProg, position: pos2, reachedStart: currNode === 0 && currProg <= EPS };
}

export default {
	lengthOfSegment,
	clampNodeIndex,
	advanceAlongPath,
	positionOnPath,
};

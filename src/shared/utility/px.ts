// Packages
import Vide from "@rbxts/vide";

const { source, derive, spring } = Vide;

const BASE_RESOLUTION = new Vector2(1920, 1080);
const MIN_SCALE = 0.25;

type UDimSource = () => UDim;
type UDim2Source = () => UDim2;

export type PxUDimFn = (value: number) => UDimSource;
export type PxUDim2Fn = {
	(x: number, y: number): UDim2Source;
	(xScale: number, xOffset: number, yScale: number, yOffset?: number): UDim2Source;
};
export type PxNumberFn = (value: number) => () => number;

export type PxSpring = <T extends Vide.Animatable>(
	fn: (scale: {
		useNumber: (n: number) => number;
		useUDim: (n: number) => UDim;
		useUDim2: {
			(a: number, b: number): UDim2;
			(a: number, b: number, c: number, d?: number): UDim2;
		};
	}) => T,
	speed?: number,
	dampening?: number,
) => () => T;

const scale = source(1);

type Target = GuiObject | Camera;

interface CurrentTarget {
	target: Target;
	cleanup: () => void;
}

let currentTarget: CurrentTarget | undefined;

function updateScaleFromSize(size: Vector2): void {
	const width = size.X / BASE_RESOLUTION.X;
	const height = size.Y / BASE_RESOLUTION.Y;
	const newScale = math.min(width, height);
	const clamped = math.max(newScale, MIN_SCALE);
	scale(clamped);
}

function setTarget(newTarget: Target): void {
	if (currentTarget && currentTarget.target === newTarget) {
		return;
	}

	if (currentTarget) {
		currentTarget.cleanup();
	}

	const event = newTarget.IsA("Camera")
		? newTarget.GetPropertyChangedSignal("ViewportSize")
		: newTarget.GetPropertyChangedSignal("AbsoluteSize");

	const update = (): void => {
		const size = newTarget.IsA("Camera") ? newTarget.ViewportSize : newTarget.AbsoluteSize;
		updateScaleFromSize(size);
	};

	const conn = event.Connect(update);
	update();

	currentTarget = {
		target: newTarget,
		cleanup: () => {
			conn.Disconnect();
		},
	};
}

function pxUDim(value: number): UDimSource {
	return derive(() => {
		const s = scale();
		return new UDim(0, value * s);
	});
}

function pxUDim2(xArg: number, yArg: number, arg3?: number, arg4?: number): UDim2Source {
	return derive(() => {
		const s = scale();
		if (arg3 === undefined) {
			return UDim2.fromOffset(xArg * s, yArg * s);
		} else {
			const xScale = xArg;
			const xOffset = yArg;
			const yScale = arg3;
			const yOffset = arg4 !== undefined ? arg4 : 0;
			return new UDim2(xScale, xOffset * s, yScale, yOffset * s);
		}
	});
}

function pxNumber(value: number): () => number {
	return derive(() => {
		return value * scale();
	});
}

function pxSpring<T extends Vide.Animatable>(
	fn: (scale: {
		useNumber: (n: number) => number;
		useUDim: (n: number) => UDim;
		useUDim2: {
			(a: number, b: number): UDim2;
			(a: number, b: number, c: number, d?: number): UDim2;
		};
	}) => T,
	speed?: number,
	dampening?: number,
): () => T {
	return spring(
		derive(() => {
			const s = scale();
			const scaleObj = {
				useNumber: (n: number): number => {
					return n * s;
				},
				useUDim: (n: number): UDim => {
					return new UDim(0, n * s);
				},
				useUDim2: (a: number, b: number, c?: number, d?: number): UDim2 => {
					if (c === undefined) {
						return UDim2.fromOffset(a * s, b * s);
					} else {
						const xScale = a;
						const xOffset = b;
						const yScale = c;
						const yOffset = d !== undefined ? d : 0;
						return new UDim2(xScale, xOffset * s, yScale, yOffset * s);
					}
				},
			};
			return fn(scaleObj);
		}),
		speed || 1,
		dampening || 1,
	);
}

export interface PxModule {
	setTarget: (target: Target) => void;
	useScale: Vide.Source<number>;
	useNumber: PxNumberFn;
	useUDim2: PxUDim2Fn;
	useSpring: PxSpring;
	useUDim: PxUDimFn;
}

const px: PxModule = {
	setTarget: setTarget,
	useSpring: pxSpring,
	useNumber: pxNumber,
	useUDim2: pxUDim2,
	useUDim: pxUDim,
	useScale: scale,
};

export default px;

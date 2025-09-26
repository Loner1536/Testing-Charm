import { t } from "@rbxts/t";

export default t.interface({
	units: t.array(
		t.interface({
			id: t.string,
			damage: t.number,
			range: t.number,
			speed: t.number,
		}),
	),
});

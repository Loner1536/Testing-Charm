import { t } from "@rbxts/t";

export default t.interface({
	gems: t.numberMax(1000000000),
	coins: t.numberMax(1000000000),
});

// Packages
import { useAtom } from "@rbxts/vide-charm";
import Network from "@network/client";

export type RawUnit = Network.DataStore.Player.Unit.Default;

export type Unit = Network.DataStore.Player.Unit.Default & {
	damage: number;
	range: number;
	spa: number;
};

type PlayerData = {
	units: ReturnType<typeof useAtom<Unit[]>>;
};

export default PlayerData;

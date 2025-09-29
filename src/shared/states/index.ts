// Packages
import Network from "@network/client";
import { atom } from "@rbxts/charm";

const states = {
	players: atom<Map<string, Network.State.PlayerData.Default>>(new Map()),

	waveData: atom<Network.State.WaveData.Default>({
		mapId: "test",
		type: "story",
		hpStocks: 0,
		vote: false,
		votes: 0,
		wave: 0,
		act: 0,
	}),
};

export default states;

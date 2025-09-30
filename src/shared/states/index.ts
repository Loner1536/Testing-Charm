// Packages
import { NetworkData } from "@shared/network";
import { atom } from "@rbxts/charm";

const states = {
	players: atom<Map<string, NetworkData.State.PlayerData.Default>>(new Map()),

	waveData: atom<NetworkData.State.WaveData.Default>({
		mapId: "test",
		type: "story",
		hpStocks: 0,
		vote: false,
		votes: 0,
		wave: 0,
		act: 0,

		enemies: new Map(),
	}),
};

export default states;

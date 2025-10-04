// Packages
import { NetworkData } from "@shared/network";
import { atom } from "@rbxts/charm";

const states = {
	players: atom<Map<string, NetworkData.State.PlayerData.Default>>(new Map()),

	waveData: atom<NetworkData.State.WaveData.Default>({
		id: "test",
		type: "story",
		hpStocks: 0,
		vote: false,
		enemies: 0,
		votes: 0,
		speed: 1,
		wave: 0,
		act: 0,
	}),
};

export default states;

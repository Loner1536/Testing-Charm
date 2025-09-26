// Packages
import Network from "@network/server";
import Charm from "@rbxts/charm";

// Charm Components
const { atom } = Charm;

export type PlayerData = Network.DataStore.Player.Default;

type PlayerDataMap = Network.DataStore.Atoms.PlayerMap;

export const datastore = {
	players: atom<PlayerDataMap>(new Map()),
};

export function getPlayerData(id: number) {
	return datastore.players().get(tostring(id));
}

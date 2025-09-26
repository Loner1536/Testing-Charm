// Packages
import { useAtom } from "@rbxts/vide-charm";

// Types
import type * as Types from "shared/types";

// Components
import { getPlayerData } from "@shared/atoms/dataStore";

const filterUnits = (units: Types.InterfaceProps.PlayerData.RawUnit[]): Types.InterfaceProps.PlayerData.Unit[] => {
	return units.map((unit) => {
		return {
			...unit,
			damage: 2,
			range: 1.5,
			spa: 0.75,
		};
	});
};

export default (player: Player): Types.InterfaceProps.default => {
	return {
		playerData: {
			units: useAtom(() => {
				const playerData = getPlayerData(player.UserId);

				return playerData && playerData.units ? filterUnits(playerData.units) : [];
			}),
		},
	};
};

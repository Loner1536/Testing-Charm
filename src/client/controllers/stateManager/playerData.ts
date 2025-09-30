// Packages
import { useAtom } from "@rbxts/vide-charm";

// Types
import type * as Types from "@shared/types";

// Components
import states from "@shared/states";

export default class PlayerData {
	public state = states.players;

	public get(player: Player): Types.InterfaceProps.PlayerData {
		return {
			gems: useAtom(() => this.state().get(tostring(player.UserId))?.gems ?? 0),
			gold: useAtom(() => this.state().get(tostring(player.UserId))?.gold ?? 0),
		};
	}
}

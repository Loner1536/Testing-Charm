// Services
import { Players, ProximityPromptService, StarterGui, Workspace } from "@rbxts/services";

// Packages
import { Controller, OnStart } from "@flamework/core";
import Vide, { source } from "@rbxts/vide";
import Network from "@network/client";

// Types
import type * as Types from "@shared/types";

// Utility
import px from "shared/utility/px";

// Components
import states from "@shared/states";

// Player Info
const player = Players.LocalPlayer;
const playerGui = player.WaitForChild("PlayerGui");

// Dependencies
import StateManager from "../stateManager";
import { useAtom } from "@rbxts/vide-charm";
import tweens from "@shared/utility/tweens";

const { mount } = Vide;

@Controller({
	loadOrder: 1,
})
export class Interface implements OnStart {
	constructor(private stateManager: StateManager) {}

	onStart() {
		mount(
			() => {
				px.setTarget(Workspace.CurrentCamera!);

				const props = this.buildProps();

				return;
			},
			(<screengui Name={"Lobby"} IgnoreGuiInset={true} ResetOnSpawn={false} Parent={playerGui} />) as ScreenGui,
		);

		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);
	}

	private buildProps() {
		return {
			playerData: {
				gems: useAtom(() => {
					const state = this.stateManager.get("players");
					const data = state().get(tostring(player.UserId));

					return data ? data.gems : 0;
				}),
				coins: useAtom(() => {
					const state = this.stateManager.get("players");
					const data = state().get(tostring(player.UserId));

					return data ? data.coins : 0;
				}),
			},
			waveData: {
				activeWave: useAtom(() => {
					const data = this.stateManager.get("waveData")();

					return data ? data.activeWave : false;
				}),
				votes: useAtom(() => {
					const data = this.stateManager.get("waveData")();

					return data ? data.votes : 0;
				}),
				wave: useAtom(() => {
					const data = this.stateManager.get("waveData")();

					return data ? data.wave : 0;
				}),
			},
		} satisfies Types.InterfaceProps.default;
	}
}

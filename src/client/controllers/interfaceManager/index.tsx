// Services
import { MarketplaceService, Players, ProximityPromptService, StarterGui, Workspace } from "@rbxts/services";

// Packages
import { Controller, OnStart } from "@flamework/core";
import { useAtom } from "@rbxts/vide-charm";
import Vide, { source } from "@rbxts/vide";
import Network from "@network/client";
import Forge from "@rbxts/forge";

// Types
import type * as Types from "@shared/types";

// Utility
import px from "shared/utility/px";

// Components
import ForgeApp from "./app";

// Configurations
import mapConfiguration, { TypeConfiguration } from "@shared/configurations/maps";

// Player Info
const player = Players.LocalPlayer;

// Dependencies
import StateManager from "../stateManager";

const { mount } = Vide;

@Controller({
	loadOrder: 1,
})
export default class InterfaceManager implements OnStart {
	constructor(private stateManager: StateManager) {}

	onStart() {
		const lobby = (
			<screengui Name={"Lobby"} ResetOnSpawn={false} IgnoreGuiInset Parent={player.WaitForChild("PlayerGui")} />
		) as ScreenGui;

		mount(() => {
			px.setTarget(Workspace.CurrentCamera!);

			Forge.render(lobby);

			const props = this.buildProps(player);

			// On spawn animation
			task.delay(1, () => {
				props.topMenu.visible(true);
			});

			return <ForgeApp props={props} />;
		}, lobby);

		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);
	}

	public buildProps(player: Player) {
		return {
			playerData: {
				gems: useAtom(() => this.stateManager.get("players")()?.get(tostring(player.UserId))?.gems ?? 0),
				coins: useAtom(() => this.stateManager.get("players")()?.get(tostring(player.UserId))?.coins ?? 0),
			},
			waveData: {
				maxStocks: useAtom(() => TypeConfiguration[this.stateManager.get("waveData")()?.type].maxStocks),
				hpStocks: useAtom(() => this.stateManager.get("waveData")()?.hpStocks ?? 0),
				vote: useAtom(() => this.stateManager.get("waveData")()?.vote ?? false),
				votes: useAtom(() => this.stateManager.get("waveData")()?.votes ?? 0),
				wave: useAtom(() => this.stateManager.get("waveData")()?.wave ?? 0),
				act: useAtom(() => this.stateManager.get("waveData")()?.act ?? 0),
			},

			network: {
				wave: {
					vote: Network.Wave.vote,
				},
			},

			topMenu: {
				visible: source(false),
			},
		} satisfies Types.InterfaceProps.default;
	}
}

// Services
import { Players, StarterGui, Workspace } from "@rbxts/services";

// Packages
import { Controller, OnStart } from "@flamework/core";
import Vide, { source } from "@rbxts/vide";
import Network from "@shared/network";
import Forge from "@rbxts/forge";

// Types
import type * as Types from "@shared/types";

// Utility
import px from "shared/utility/px";

// Components
import ForgeApp from "./app";

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
			playerData: this.stateManager.playerData.get(player),
			waveData: this.stateManager.waveData.get(),

			network: Network,

			topMenu: {
				visible: source(false),
			},
		} satisfies Types.InterfaceProps.default;
	}
}

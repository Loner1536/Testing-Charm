// Services
import { Players, StarterGui, Workspace } from "@rbxts/services";

// Packages
import { Controller, OnStart } from "@flamework/core";
import Vide, { mount, source } from "@rbxts/vide";
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
import JecsManager from "../jecsManager";

@Controller({
	loadOrder: 1,
})
export default class InterfaceManager implements OnStart {
	constructor(private jecsManager: JecsManager) {}

	onStart() {
		const lobby = (
			<screengui Name={"Lobby"} ResetOnSpawn={false} IgnoreGuiInset Parent={player.WaitForChild("PlayerGui")} />
		) as ScreenGui;

		mount(() => {
			px.setTarget(Workspace.CurrentCamera!);

			Forge.render(lobby);

			const props = this.buildProps(player);
			if (!props) return error("couldn't build interface props");

			// On spawn animation
			task.delay(1, () => {
				props.topMenu.visible(true);
			});

			return <ForgeApp props={props} />;
		}, lobby);

		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);
	}

	public buildProps(player: Player) {
		const playerData = this.jecsManager.sim.StateManager.playerData.getProps(player);
		if (!playerData) return warn("couldn't get player data for interface manager");

		const waveData = this.jecsManager.sim.StateManager.waveData.getProps();
		if (!waveData) return warn("couldn't get wave data for interface manager");

		return {
			playerData: playerData,
			waveData: waveData,

			network: {
				wave: {
					vote: {
						emit: () => {
							Network.server.emit(Network.keys.wave.vote);
						},
					},
				},
			},

			topMenu: {
				visible: source(false),
			},
		} satisfies Types.InterfaceProps.default;
	}
}

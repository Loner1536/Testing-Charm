// Packages
import Network, { NetworkData } from "@shared/network";
import CharmSync from "@rbxts/charm-sync";
import Forge from "@rbxts/forge";
import Vide from "@rbxts/vide";

// Types
import type { InferVideProps } from "@rbxts/ui-labs";

// Types
import type * as Types from "@shared/types";

// Utility
import px from "@shared/utility/px";

// Components
import states from "@shared/stateManager/states";
import template from "./template";

// Dependencies
import InterfaceManager from "@client/controllers/interfaceManager";
import JecsManager from "@client/controllers/jecsManager";

const syncer = CharmSync.client({ atoms: states });

export default function (
	props: InferVideProps<{}>,
	forgeComponent: ({ props }: { props: Types.InterfaceProps.default }) => GuiObject | GuiObject[],
	callback: (interfaceProps: Types.InterfaceProps.default) => void,
) {
	px.setTarget(props.target);

	const mockedPlayer = {
		Name: "UI-Labs",
		UserId: math.random(1, 1000000000),
	} as unknown as Player;

	const playerData = table.clone(template);

	const playersMap = new Map<string, unknown>();
	playersMap.set(tostring(mockedPlayer.UserId), playerData);

	const payload = {
		type: "init",
		data: { players: playersMap },
	};

	syncer.sync(payload as never);

	const mockedStore = {
		updateAsync: (
			_: unknown,
			player: Player,
			transformFunction: (data: NetworkData.State.PlayerData.Default) => boolean,
		): boolean => {
			let success = false;

			if (transformFunction(playerData)) {
				success = true;

				const playersMap = new Map<string, unknown>();
				playersMap.set(tostring(mockedPlayer.UserId), playerData);

				const payload = {
					type: "patch",
					data: { players: playersMap },
				};
				syncer.sync(payload as never);
			}

			return success;
		},
	};

	const transformer = () => {
		task.defer(() => {
			props.target.GetDescendants().forEach((child: Instance) => {
				if (!child.IsA || !child.IsA("GuiButton")) return;

				Vide.apply(child)({
					MouseButton1Down: () => {
						if (!child.Active) return;

						// <CreateRipple component={child} mousePos={interfaceProps.userInput.GetMouseLocation()} />;
					},
				});
			});
		});

		Forge.render(props.target);

		const jecsManager = new JecsManager();
		const interfaceManager = new InterfaceManager(jecsManager);
		const interfaceProps = interfaceManager.buildProps(mockedPlayer);

		if (!interfaceProps) return error("couldn't build interface props");

		callback(interfaceProps);

		interfaceProps.network = {
			wave: {
				vote: {
					emit: () => {
						jecsManager.sim.S.Network.Wave.Vote(mockedPlayer);
					},
				},
			},
		} as Types.InterfaceProps.default["network"];

		return forgeComponent({ props: interfaceProps });
	};

	return transformer();
}

// // Packages
// import CharmSync from "@rbxts/charm-sync";
// import { Network } from "@shared/network";
// import Forge from "@rbxts/forge";
// import Vide from "@rbxts/vide";

// // Types
// import type { InferVideProps } from "@rbxts/ui-labs";

// // Types
// import type * as Types from "shared/types";

// // Utility
// import px from "shared/utility/px";

// // Components
// import states from "shared/states";
// import template from "./template";

// // Dependencies
// import InterfaceManager from "@client/controllers/interfaceManager";
// import ClientStateManager from "@client/controllers/stateManager";
// import ServerStateManager from "@server/services/stateManager";
// import NetworkManager from "@server/services/networkManager";
// import JecsManager from "@server/services/jecsManager";
// import WaveManager from "@server/services/waveManager";
// import DataManager from "@server/services/dataManger";

// const syncer = CharmSync.client({ atoms: states });

// export default function (
// 	props: InferVideProps<{}>,
// 	forgeComponent: ({ props }: { props: Types.InterfaceProps.default }) => GuiObject | GuiObject[],
// 	callback: (interfaceProps: Types.InterfaceProps.default) => void,
// ) {
// 	px.setTarget(props.target);

// 	const mockedPlayer = {
// 		Name: "UI-Labs",
// 		UserId: math.random(1, 1000000000),
// 	} as unknown as Player;

// 	const jecsManager = new JecsManager();
// 	const clientStateManager = new ClientStateManager();
// 	const serverStateManager = new ServerStateManager();
// 	const dataManager = new DataManager(serverStateManager);
// 	const waveManager = new WaveManager(serverStateManager, jecsManager);
// 	const networkManager = new NetworkManager(serverStateManager, dataManager, waveManager);

// 	const interfaceProps = new InterfaceManager(clientStateManager).buildProps(mockedPlayer);

// 	const playerData = table.clone(template);

// 	const playersMap = new Map<string, unknown>();
// 	playersMap.set(tostring(mockedPlayer.UserId), playerData);

// 	const payload = {
// 		type: "init",
// 		data: { players: playersMap },
// 	};
// 	syncer.sync(payload as never);

// 	const mockedStore = {
// 		updateAsync: (
// 			_: unknown,
// 			player: Player,
// 			transformFunction: (data: Network.State.PlayerData.Default) => boolean,
// 		): boolean => {
// 			let success = false;

// 			if (transformFunction(playerData)) {
// 				success = true;

// 				const playersMap = new Map<string, unknown>();
// 				playersMap.set(tostring(mockedPlayer.UserId), playerData);

// 				const payload = {
// 					type: "patch",
// 					data: { players: playersMap },
// 				};
// 				syncer.sync(payload as never);
// 			}

// 			return success;
// 		},
// 	};

// 	const network = {
// 		Wave: {
// 			vote: {
// 				fire: (player: Player) => {
// 					networkManager.wave.vote(player);
// 				},
// 			},
// 		},
// 	};

// 	const transformer = () => {
// 		task.defer(() => {
// 			props.target.GetDescendants().forEach((child: Instance) => {
// 				if (!child.IsA || !child.IsA("GuiButton")) return;

// 				Vide.apply(child)({
// 					MouseButton1Down: () => {
// 						if (!child.Active) return;

// 						// <CreateRipple component={child} mousePos={interfaceProps.userInput.GetMouseLocation()} />;
// 					},
// 				});
// 			});
// 		});

// 		Forge.render(props.target);

// 		callback(interfaceProps);

// 		interfaceProps.network = {
// 			wave: {
// 				vote: {
// 					fire: () => {
// 						networkManager.wave.vote(mockedPlayer);
// 					},
// 				},
// 			},
// 		} satisfies Types.InterfaceProps.default["network"];

// 		return forgeComponent({ props: interfaceProps });
// 	};

// 	return transformer();
// }

// // Packages
// import CharmSync from "@rbxts/charm-sync";
// import Network from "@network/server";

// // Types
// import type { InferVideProps } from "@rbxts/ui-labs";
// import type { PlayerStore } from "@rbxts/lyra";

// // Types
// import type * as Types from "shared/types";

// // Utility
// import px from "shared/utility/px";

// // Dependencies
// import props from "@client/controllers/interface/props";
// import template from "./template";

// // Components
// import atoms from "shared/atoms";

// const syncer = CharmSync.client({ atoms });

// export default function (
// 	uilabsProps: InferVideProps<{}>,
// 	callback: (interfaceProps: Types.InterfaceProps.default) => void,
// ) {
// 	px.setTarget(uilabsProps.target);

// 	const mockedPlayer = {
// 		Name: "UI-Labs",
// 		UserId: math.random(1, 1000000000),
// 	} as unknown as Player;

// 	const interfaceProps = props(mockedPlayer);

// 	const playerData = table.clone(template);

// 	const playersMap = new Map<string, unknown>();
// 	playersMap.set(tostring(mockedPlayer.UserId), playerData);

// 	const payload = {
// 		type: "init",
// 		data: { players: playersMap },
// 	} as Parameters<typeof Network.DataStore.Atoms.sync.fire>[1];
// 	syncer.sync(payload as never);

// 	const mockedStore = {
// 		updateAsync: (
// 			_: unknown,
// 			player: Player,
// 			transformFunction: (data: Network.DataStore.Player.Default) => boolean,
// 		): boolean => {
// 			let success = false;

// 			if (transformFunction(playerData)) {
// 				success = true;

// 				const playersMap = new Map<string, unknown>();
// 				playersMap.set(tostring(mockedPlayer.UserId), playerData);

// 				const payload = {
// 					type: "patch",
// 					data: { players: playersMap },
// 				} as Parameters<typeof Network.DataStore.Atoms.sync.fire>[1];
// 				syncer.sync(payload as never);
// 			}

// 			return success;
// 		},
// 	} as unknown as PlayerStore<Network.DataStore.Player.Default>;

// 	return callback(interfaceProps);
// }

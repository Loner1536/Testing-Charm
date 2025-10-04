// Packages
import type { SerializeablePayload } from "@rbxts/charm-payload-converter";
import { MessageEmitter } from "@rbxts/tether";
import { u8, u16, Tuple, type Serializer } from "@rbxts/serio";

// Components
import states from "@shared/stateManager/states";

export namespace NetworkData {
	export namespace State {
		export namespace PlayerData {
			export type Default = {
				gems: u8;
				gold: u8;
			};
		}
		export namespace WaveData {
			export type Default = {
				id: string;
				type: "story";
				hpStocks: u8;
				vote: boolean;
				enemies: u16;
				speed: u8;
				votes: u8;
				wave: u8;
				act: u8;
			};
		}
	}

	export namespace Jecs {
		export type ReplecsData = Serializer<Tuple<[buffer, unknown[][]]>> | undefined;
	}
}

export const keys = {
	state: {
		sync: 0,
		init: 1,
	},
	wave: {
		vote: 50,
		gameSpeed: 51,
	},
	jecs: {
		receiveFull: 100,
		receiveFullReturn: 101,

		sendUpdates: 102,
		sendUpdatesFullReturn: 103,
	},
} as const;

type MessengerPayloads = {
	[keys.state.sync]: SerializeablePayload<typeof states>;
	[keys.state.init]: void;
	[keys.wave.vote]: void;
	[keys.wave.gameSpeed]: number;
	[keys.jecs.receiveFull]: void;
	[keys.jecs.receiveFullReturn]: NetworkData.Jecs.ReplecsData;
	[keys.jecs.sendUpdates]: NetworkData.Jecs.ReplecsData;
	[keys.jecs.sendUpdatesFullReturn]: NetworkData.Jecs.ReplecsData;
};

function createMessenger() {
	const Messenger = MessageEmitter.create<MessengerPayloads>();

	return {
		...Messenger,
		keys,
	};
}

let Network: ReturnType<typeof createMessenger> | undefined = undefined;

export default Network ?? createMessenger();

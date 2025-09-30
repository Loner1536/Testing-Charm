// Packages
import type { SerializeablePayload } from "@rbxts/charm-payload-converter";
import { MessageEmitter } from "@rbxts/tether";
import { u8 } from "@rbxts/serio";

// Components
import states from "@shared/states";

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
				mapId: string;
				type: "story" | "raid";
				hpStocks: u8;
				vote: boolean;
				votes: u8;
				wave: u8;
				act: u8;

				enemies: Map<string, { pathIndex: number; hp: u8; speed: u8 }>;
			};
		}
	}

	export namespace Jecs {
		export type ReplecsData = {
			buf: buffer;
			variants: Array<Array<unknown>>;
		};
	}
}

export const keys = {
	state: {
		sync: 0,
		init: 1,
	},
	wave: {
		vote: 2,
	},
	jecs: {
		receiveFull: 3,
		receiveFullReturn: 4,

		sendUpdates: 5,
	},
} as const;

type MessengerPayloads = {
	[keys.state.sync]: SerializeablePayload<typeof states>;
	[keys.state.init]: void;
	[keys.wave.vote]: void;
	[keys.jecs.receiveFull]: void;
	[keys.jecs.receiveFullReturn]: NetworkData.Jecs.ReplecsData;
	[keys.jecs.sendUpdates]: NetworkData.Jecs.ReplecsData;
};

function createMessenger() {
	const Messenger = MessageEmitter.create<MessengerPayloads>();

	return {
		middleware: Messenger.middleware,
		keys,
		client: {
			fire<K extends keyof MessengerPayloads>(player: Player, key: K, payload?: MessengerPayloads[K]) {
				Messenger.client.emit(player, key, payload);
			},
			on<K extends keyof MessengerPayloads>(key: K, callback: (payload: MessengerPayloads[K]) => void) {
				Messenger.client.on(key, callback);
			},
			setCallback: Messenger.client.setCallback,
			invoke: Messenger.client.invoke,
		},
		server: {
			fire<K extends keyof MessengerPayloads>(key: K, payload?: MessengerPayloads[K]) {
				Messenger.server.emit(key, payload);
			},
			on<K extends keyof MessengerPayloads>(
				key: K,
				callback: (player: Player, payload: MessengerPayloads[K]) => void,
			) {
				Messenger.server.on(key, callback);
			},
			setCallback: Messenger.server.setCallback,
			invoke: Messenger.server.invoke,
		},
	};
}

let Network: ReturnType<typeof createMessenger> | undefined = undefined;

export default Network ?? createMessenger();

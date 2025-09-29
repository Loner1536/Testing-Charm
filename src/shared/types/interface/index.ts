// Packages
import Network from "@network/client";
import { Source } from "@rbxts/vide";

export type PlayerData = {
	gems: Source<number>;
	coins: Source<number>;
};

export type WaveData = {
	mapId: Source<string>;
	maxStocks: Source<number>;
	hpStocks: Source<number>;
	vote: Source<boolean>;
	votes: Source<number>;
	wave: Source<number>;
	act: Source<number>;
};

export type TopMenu = {
	visible: Source<boolean>;
};

type InterfaceProps = {
	playerData: PlayerData;
	waveData: WaveData;

	network: {
		wave: {
			vote: (typeof Network)["Wave"]["vote"];
		};
	};

	topMenu: TopMenu;
};

export default InterfaceProps;

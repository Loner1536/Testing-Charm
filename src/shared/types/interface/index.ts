// Packages
import { NetworkData } from "@shared/network";
import { Source } from "@rbxts/vide";

type Sourceify<T> = {
	[K in keyof T]: Source<T[K]>;
};

export type PlayerData = Sourceify<NetworkData.State.PlayerData.Default>;
export type WaveData = Sourceify<NetworkData.State.WaveData.Default>;

export type TopMenu = {
	visible: Source<boolean>;
};

type InterfaceProps = {
	playerData: PlayerData;
	waveData: WaveData;

	network: {
		wave: {
			vote: {
				emit: () => void;
			};
		};
	};

	topMenu: TopMenu;
};

export default InterfaceProps;

// Packages
import { Source } from "@rbxts/vide";

export type PlayerData = {
	gems: Source<number>;
	coins: Source<number>;
};

export type WaveData = {
	activeWave: Source<boolean>;
	votes: Source<number>;
	wave: Source<number>;
};

type InterfaceProps = {
	playerData: PlayerData;
	waveData: WaveData;
};

export default InterfaceProps;

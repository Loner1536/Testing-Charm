// Packages
import { useAtom } from "@rbxts/vide-charm";

// Types
import type * as Types from "@shared/types";

// Components
import states from "@shared/states";

export default class WaveData {
	public state = states.waveData;

	public get(): Types.InterfaceProps.WaveData {
		return {
			mapId: useAtom(() => this.state().mapId ?? "test"),
			type: useAtom(() => this.state().type ?? "normal"),
			hpStocks: useAtom(() => this.state().hpStocks ?? 0),
			vote: useAtom(() => this.state().vote ?? false),
			votes: useAtom(() => this.state().votes ?? 0),
			wave: useAtom(() => this.state().wave ?? 0),
			act: useAtom(() => this.state().act ?? 0),

			enemies: useAtom(() => this.state().enemies ?? []),
		};
	}
}

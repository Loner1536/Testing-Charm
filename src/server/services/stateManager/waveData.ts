// Packages
import Object from "@rbxts/object-utils";
import Network from "@network/server";

// Components
import states from "@shared/states";

export default class WaveData {
	private state = states.waveData;

	public get() {
		return this.state();
	}

	public update(updater: (data: Network.State.WaveData.Default) => Network.State.WaveData.Default) {
		this.state((state) => {
			const newState = Object.deepCopy(state);
			return updater(newState);
		});
	}
}

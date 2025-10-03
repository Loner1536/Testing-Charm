// Children
import EnemySystem from "./enemy";
import TowerSystem from "./tower";

export default class Systems {
	// Core
	public Enemy = new EnemySystem();
	public Tower = new TowerSystem();
}

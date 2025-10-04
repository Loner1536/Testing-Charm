// Maps
import SandVillage from "./Sand Village";

// Configuration
const mapConfiguration = {
	story: {
		SandVillage,
	},
} as const;

export const typeConfiguration = {
	story: { maxStocks: 3 },
} as const;

export default mapConfiguration;

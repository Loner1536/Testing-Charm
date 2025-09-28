// Configuration
const mapConfiguration = {
	story: {
		test: {
			acts: [
				{
					waves: {
						1: { enemies: [{ model: undefined }] },
						2: { enemies: [{ model: undefined }] },
					},
				},
			],
		},
	},
	raid: {
		dungeon: {
			acts: [
				{
					waves: {
						1: { enemies: [{ model: undefined }] },
						2: { enemies: [{ model: undefined }] },
					},
				},
			],
		},
	},
} as const;

const TypeConfiguration = {
	story: { maxStocks: 3 },
	raid: { maxStocks: 5 },
} as const;

export { TypeConfiguration };
export default mapConfiguration;

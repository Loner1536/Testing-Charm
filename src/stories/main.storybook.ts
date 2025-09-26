import { Storybook } from "@rbxts/ui-labs";

const storybook: Storybook = {
	name: "Main",
	storyRoots: [script.Parent!.FindFirstChild("Main")! as Folder],
};

export = storybook;

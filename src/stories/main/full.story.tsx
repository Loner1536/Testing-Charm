// Packages
import { CreateVideStory, InferVideProps, Boolean } from "@rbxts/ui-labs";
import Vide from "@rbxts/vide";

// Utility
import setup from "../setup";

// Components
import ForgeApp from "@client/controllers/interfaceManager/app";

const controls = {
	topMenu: Boolean(true),
};

const story = CreateVideStory(
	{
		vide: Vide,
		controls: controls,
	},
	(props: InferVideProps<typeof controls>) =>
		setup(props, ForgeApp, (interfaceProps) => {
			task.defer(interfaceProps.topMenu.visible, true);

			props.controls.topMenu = interfaceProps.topMenu.visible;
		}),
);

export = story;

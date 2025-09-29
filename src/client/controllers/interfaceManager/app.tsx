// Packages
import Forge from "@rbxts/forge";

// Types
import type * as Types from "@shared/types";

// Components
import TopMenuComponents from "@shared/interface/topMenu";

export default function ForgeApp({ props }: { props: Types.InterfaceProps.default }) {
	return [
		Forge.add({
			component: TopMenuComponents,
			visible: props.topMenu.visible,
			args: [{ props }],
			fadeSpeed: 0.2,
			window: true,
		}),
	];
}

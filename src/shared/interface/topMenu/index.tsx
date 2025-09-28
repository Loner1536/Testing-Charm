// Services
import { Players, RunService } from "@rbxts/services";

// Packages
import Vide, { source, spring } from "@rbxts/vide";

// Types
import type * as Types from "@shared/types";

// Utility
import px from "@shared/utility/px";

export default function TopMenu({ props }: { props: Types.InterfaceProps.default }) {
	print("Rendering Top Menu");

	const onHover = source(false);
	const onPress = source(false);

	return (
		<frame
			Name={"Top Menu"}
			BackgroundTransparency={1}
			AnchorPoint={new Vector2(0.5, 0)}
			Position={px.useSpring(
				(scale) => {
					const yOffset = props.topMenu.visible() ? 10 : -50;
					return scale.useUDim2(0.5, 0, 0, yOffset);
				},
				0.4,
				0.8,
			)}
			Size={px.useUDim2(1, 0, 0, 200)}
		>
			<frame
				Name={"Stock Bar"}
				BackgroundColor3={Color3.fromRGB(25, 25, 25)}
				AnchorPoint={new Vector2(0.5, 0)}
				Position={px.useSpring(
					(scale) => {
						const yOffset = props.topMenu.visible() ? 10 : -50;
						return scale.useUDim2(0.5, 0, 0, yOffset);
					},
					0.5,
					0.5,
				)}
				Size={px.useUDim2(600, 20)}
			>
				<canvasgroup
					Name={"Bar Clipper"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(0.5, 0)}
					Position={UDim2.fromScale(0.5, 0)}
					Size={spring(
						() => {
							return UDim2.fromScale(1, 1);
						},
						0.4,
						0.8,
					)}
					ClipsDescendants={true}
				>
					<uicorner CornerRadius={px.useUDim(50)} />
					<frame
						Name={"Bar"}
						AnchorPoint={new Vector2(0.5, 0.5)}
						Position={UDim2.fromScale(0.5, 0.5)}
						Size={UDim2.fromScale(1, 1)}
					>
						<uigradient
							Color={
								new ColorSequence([
									new ColorSequenceKeypoint(0, Color3.fromRGB(90, 255, 90)),
									new ColorSequenceKeypoint(1, Color3.fromRGB(20, 100, 20)),
								])
							}
							Rotation={90}
						/>
					</frame>
				</canvasgroup>
				<textlabel
					Name={"Stock Count"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(0.5, 0.5)}
					Position={UDim2.fromScale(0.5, 0.5)}
					Size={UDim2.fromScale(1, 1)}
					TextColor3={Color3.fromRGB(225, 225, 225)}
					Font={"FredokaOne"}
					TextSize={px.useNumber(32)}
					Text={() => {
						return `Stocks: ${props.waveData.hpStocks()}/${props.waveData.maxStocks()}`;
					}}
					TextXAlignment={"Center"}
					TextYAlignment={"Center"}
				>
					<uistroke Thickness={px.useNumber(2.5)} Transparency={0.25} />
				</textlabel>
				<textlabel
					Name={"Wave Count"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(1, 0.5)}
					Position={px.useUDim2(0, -10, 0.5, 0)}
					Size={px.useUDim2(150, 50)}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					Font={"FredokaOne"}
					TextSize={px.useNumber(28)}
					Text={() => {
						return `Wave  ${props.waveData.wave()}<font color="rgb(150, 150, 150)">/${1 ?? "∞"}</font>`;
					}}
					TextXAlignment={"Right"}
					TextYAlignment={"Center"}
					RichText
				>
					<uistroke Thickness={px.useNumber(2.5)} Transparency={0.25} />
				</textlabel>
				<textlabel
					Name={"Wave Count"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(0, 0.5)}
					Position={px.useUDim2(1, 10, 0.5, 0)}
					Size={px.useUDim2(150, 50)}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					Font={"FredokaOne"}
					TextSize={px.useNumber(28)}
					Text={() => {
						return `00:00:00`;
					}}
					TextXAlignment={"Left"}
					TextYAlignment={"Center"}
					RichText
				>
					<uistroke Thickness={px.useNumber(2.5)} Transparency={0.25} />
				</textlabel>

				<uistroke Thickness={px.useNumber(2.5)} Transparency={0.25} />
				<uicorner CornerRadius={px.useUDim(50)} />
			</frame>
			<frame
				Name={"Vote"}
				BackgroundColor3={Color3.fromRGB(50, 50, 50)}
				AnchorPoint={new Vector2(0.5, 0)}
				Position={px.useSpring(
					(scale) => {
						const yOffset = props.waveData.activeWave() ? -75 : 50;
						return scale.useUDim2(0.5, 0, 0, yOffset);
					},
					0.25,
					0.5,
				)}
				Size={px.useSpring(
					(scale) => {
						const multi = onPress() ? 0.95 : onHover() ? 1.05 : 1;
						return scale.useUDim2(200 * multi, 50 * multi);
					},
					0.25,
					0.5,
				)}
			>
				<uistroke Color={Color3.fromRGB(255, 255, 255)} Thickness={px.useNumber(2.5)} />
				<uicorner CornerRadius={px.useUDim(10)} />

				<textlabel
					Name={"Label"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(0.5, 1)}
					Position={px.useUDim2(0.5, 0, 1, -5)}
					Size={px.useUDim2(1, 0, 0, 25)}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					Font={"FredokaOne"}
					TextSize={px.useNumber(24)}
					Text={() => {
						const votes = `${props.waveData.votes()}/${RunService.IsRunning() ? Players.GetPlayers().size() : 1}`;
						return props.waveData.wave() === 0 ? `Vote start: ${votes}` : `Vote to Skip: ${votes}`;
					}}
					TextXAlignment={"Center"}
					TextYAlignment={"Center"}
				>
					<uistroke Thickness={px.useNumber(2.5)} Transparency={0.25} />
				</textlabel>

				<textlabel
					Name={"Label"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(0.5, 0.1)}
					Position={UDim2.fromScale(0.5, 0.1)}
					Size={px.useUDim2(1, 0, 0, 25)}
					TextColor3={Color3.fromRGB(150, 150, 150)}
					TextTransparency={0.25}
					Font={"FredokaOne"}
					TextSize={px.useNumber(18)}
					Text={"Click to vote"}
					TextXAlignment={"Center"}
					TextYAlignment={"Center"}
				>
					<uistroke Thickness={px.useNumber(2.5)} Transparency={0.75} />
				</textlabel>

				<textbutton
					Name={"button"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(0.5, 0.5)}
					Position={UDim2.fromScale(0.5, 0.5)}
					Size={UDim2.fromScale(1, 1)}
					// Events
					MouseEnter={() => onHover(true)}
					MouseLeave={() => {
						onHover(false);
						onPress(false);
					}}
					MouseButton1Down={() => onPress(true)}
					MouseButton1Up={() => {
						onPress(false);

						props.network.wave.vote.fire();
					}}
				/>
			</frame>
		</frame>
	);
}

import { createPortal } from "react-dom";
import { useSliderCommit } from "../hooks/useSliderCommit";
import { getPopoverPosition, useThemePopover } from "../hooks/useThemePopover";
import { ThemePicker } from "./ThemePicker";
import type { ToolbarProps } from "./Toolbar";

export function ToolbarChrome(props: ToolbarProps) {
	const master = useSliderCommit(
		props.masterVolume,
		props.onMasterVolumePreview,
		props.onMasterVolumeCommit,
	);
	const {
		themeAnchorRef,
		popoverRef,
		popoverRect,
		closeThemePicker,
		openThemePicker,
	} = useThemePopover(props.showThemePicker, props.onCloseTheme);

	return (
		<>
			<ToolbarTitlebar />
			<ToolbarHeader
				{...props}
				master={master}
				themeAnchorRef={themeAnchorRef}
				closeThemePicker={closeThemePicker}
				openThemePicker={openThemePicker}
			/>
			<ThemePopover
				{...props}
				popoverRef={popoverRef}
				popoverRect={popoverRect}
				closeThemePicker={closeThemePicker}
			/>
		</>
	);
}

function ToolbarTitlebar() {
	return (
		<div
			className="titlebar electrobun-webkit-app-region-drag"
			title="Drag to move window"
		>
			<h1 className="app-title">Soundboard</h1>
		</div>
	);
}

function ToolbarHeader({
	master,
	themeAnchorRef,
	closeThemePicker,
	openThemePicker,
	...props
}: ToolbarProps & {
	master: ReturnType<typeof useSliderCommit>;
	themeAnchorRef: ReturnType<typeof useThemePopover>["themeAnchorRef"];
	closeThemePicker: () => void;
	openThemePicker: () => void;
}) {
	return (
		<header className="toolbar electrobun-webkit-app-region-no-drag">
			<div className="toolbar-actions electrobun-webkit-app-region-no-drag">
				<button type="button" className="btn-primary" onClick={props.onImport}>
					Import
				</button>
				<button type="button" className="btn-secondary" onClick={props.onStopAll}>
					Stop all
				</button>
			</div>
			<ToolbarSliders
				{...props}
				master={master}
				themeAnchorRef={themeAnchorRef}
				closeThemePicker={closeThemePicker}
				openThemePicker={openThemePicker}
			/>
		</header>
	);
}

function ToolbarSliders({
	master,
	themeAnchorRef,
	closeThemePicker,
	openThemePicker,
	...props
}: ToolbarProps & {
	master: ReturnType<typeof useSliderCommit>;
	themeAnchorRef: ReturnType<typeof useThemePopover>["themeAnchorRef"];
	closeThemePicker: () => void;
	openThemePicker: () => void;
}) {
	return (
		<div className="toolbar-sliders electrobun-webkit-app-region-no-drag">
			<label className="toolbar-control electrobun-webkit-app-region-no-drag">
				<span className="toolbar-label">Volume</span>
				<input
					type="range"
					min={0}
					max={1}
					step={0.01}
					value={master.display}
					onInput={(e) => master.onInput(Number(e.currentTarget.value))}
					onChange={(e) => master.onInput(Number(e.currentTarget.value))}
					onPointerDown={master.onPointerDown}
					onPointerUp={master.commit}
					onPointerCancel={master.commit}
					onKeyUp={master.commit}
					className="glass-slider electrobun-webkit-app-region-no-drag"
				/>
			</label>
			<label className="toolbar-toggle electrobun-webkit-app-region-no-drag">
				<input
					type="checkbox"
					checked={props.alwaysOnTop}
					onChange={(e) => props.onAlwaysOnTop(e.target.checked)}
				/>
				<span>On top</span>
			</label>
			<ThemeToggleButton
				{...props}
				themeAnchorRef={themeAnchorRef}
				closeThemePicker={closeThemePicker}
				openThemePicker={openThemePicker}
			/>
		</div>
	);
}

function ThemeToggleButton({
	showThemePicker,
	onToggleTheme,
	themeAnchorRef,
	closeThemePicker,
	openThemePicker,
}: ToolbarProps & {
	themeAnchorRef: ReturnType<typeof useThemePopover>["themeAnchorRef"];
	closeThemePicker: () => void;
	openThemePicker: () => void;
}) {
	return (
		<button
			ref={themeAnchorRef}
			type="button"
			className={`icon-btn theme-toggle electrobun-webkit-app-region-no-drag ${showThemePicker ? "active" : ""}`}
			onClick={() =>
				toggleThemePicker(
					showThemePicker,
					closeThemePicker,
					openThemePicker,
					onToggleTheme,
				)
			}
			onPointerDown={(e) => e.stopPropagation()}
			title="Accent color"
			aria-expanded={showThemePicker}
			aria-haspopup="true"
		>
			<span className="theme-toggle-icon" aria-hidden />
		</button>
	);
}

function ThemePopover({
	accentPreset,
	onAccent,
	showThemePicker,
	popoverRef,
	popoverRect,
	closeThemePicker,
}: ToolbarProps & {
	popoverRef: ReturnType<typeof useThemePopover>["popoverRef"];
	popoverRect: ReturnType<typeof useThemePopover>["popoverRect"];
	closeThemePicker: () => void;
}) {
	if (!showThemePicker || !popoverRect) return null;
	return createPortal(
		<div
			ref={popoverRef}
			className="theme-picker-popover glass-panel electrobun-webkit-app-region-no-drag"
			style={getPopoverPosition(popoverRect)}
		>
			<p className="theme-picker-label">Accent</p>
			<ThemePicker
				value={accentPreset}
				onChange={(preset) => {
					onAccent(preset);
					closeThemePicker();
				}}
			/>
		</div>,
		document.body,
	);
}

function toggleThemePicker(
	showThemePicker: boolean,
	closeThemePicker: () => void,
	openThemePicker: () => void,
	onToggleTheme: () => void,
): void {
	if (showThemePicker) {
		closeThemePicker();
		return;
	}
	openThemePicker();
	onToggleTheme();
}

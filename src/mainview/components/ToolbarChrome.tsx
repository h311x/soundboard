import { createPortal } from "react-dom";
import { useSliderCommit } from "../hooks/useSliderCommit";
import { getPopoverPosition, useThemePopover } from "../hooks/useThemePopover";
import { ThemePicker } from "./ThemePicker";
import type { ToolbarProps } from "./Toolbar";
import { Button } from "./ui/Button";
import { GlassPanel } from "./ui/GlassPanel";
import { IconButton } from "./ui/IconButton";

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
			className="titlebar z-[2] flex min-h-[calc(var(--titlebar-inset-top)+32px)] shrink-0 cursor-grab items-end justify-between px-5 pb-2 pl-[var(--titlebar-inset-left)] pt-[var(--titlebar-inset-top)] select-none active:cursor-grabbing electrobun-webkit-app-region-drag"
			title="Drag to move window"
		>
			<h1 className="m-0 text-[1.05rem] font-semibold leading-tight tracking-[-0.03em]">
				Soundboard
			</h1>
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
		<header className="toolbar z-[2] flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--glass-border)] bg-white/[0.03] px-5 py-2.5 electrobun-webkit-app-region-no-drag">
			<div className="flex flex-wrap items-center gap-2.5 electrobun-webkit-app-region-no-drag">
				<Button onClick={props.onImport}>Import</Button>
				<Button variant="secondary" onClick={props.onStopAll}>
					Stop all
				</Button>
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
		<div className="flex flex-wrap items-center gap-2.5 electrobun-webkit-app-region-no-drag">
			<label className="flex items-center gap-2 electrobun-webkit-app-region-no-drag">
				<span className="text-xs text-[var(--text-muted)]">Volume</span>
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
					className="w-full accent-[var(--accent-focus)] electrobun-webkit-app-region-no-drag"
				/>
			</label>
			<label className="flex cursor-pointer items-center gap-1.5 text-[0.8rem] text-[var(--text-muted)] electrobun-webkit-app-region-no-drag">
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
		<IconButton
			ref={themeAnchorRef}
			active={showThemePicker}
			className="electrobun-webkit-app-region-no-drag"
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
			<span
				className="block size-3.5 rounded-full bg-[linear-gradient(90deg,hsl(var(--accent-hsl))_50%,rgba(255,255,255,0.25)_50%)]"
				aria-hidden
			/>
		</IconButton>
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
		<GlassPanel
			ref={popoverRef}
			className="pointer-events-auto min-w-[200px] rounded-[var(--radius-sm)] px-3.5 py-3 electrobun-webkit-app-region-no-drag"
			style={getPopoverPosition(popoverRect)}
		>
			<p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
				Accent
			</p>
			<ThemePicker
				value={accentPreset}
				onChange={(preset) => {
					onAccent(preset);
					closeThemePicker();
				}}
			/>
		</GlassPanel>,
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

import type { AccentPresetId } from "@shared/types";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSliderCommit } from "../hooks/useSliderCommit";
import { ThemePicker } from "./ThemePicker";

type Props = {
	masterVolume: number;
	alwaysOnTop: boolean;
	showThemePicker: boolean;
	onImport: () => void;
	onStopAll: () => void;
	onMasterVolumePreview: (v: number) => void;
	onMasterVolumeCommit: (v: number) => void;
	onAlwaysOnTop: (v: boolean) => void;
	onAccent: (preset: AccentPresetId) => void;
	onToggleTheme: () => void;
	onCloseTheme: () => void;
	accentPreset: AccentPresetId;
};

export function Toolbar({
	masterVolume,
	alwaysOnTop,
	showThemePicker,
	onImport,
	onStopAll,
	onMasterVolumePreview,
	onMasterVolumeCommit,
	onAlwaysOnTop,
	onAccent,
	onToggleTheme,
	onCloseTheme,
	accentPreset,
}: Props) {
	const themeAnchorRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const master = useSliderCommit(
		masterVolume,
		onMasterVolumePreview,
		onMasterVolumeCommit,
	);

	useEffect(() => {
		if (!showThemePicker) return;

		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as Node;
			if (
				popoverRef.current?.contains(target) ||
				themeAnchorRef.current?.contains(target)
			) {
				return;
			}
			onCloseTheme();
		};

		window.addEventListener("pointerdown", onPointerDown);
		return () => window.removeEventListener("pointerdown", onPointerDown);
	}, [showThemePicker, onCloseTheme]);

	const popover =
		showThemePicker &&
		themeAnchorRef.current &&
		createPortal(
			<div
				ref={popoverRef}
				className="theme-picker-popover glass-panel electrobun-webkit-app-region-no-drag"
				style={getPopoverPosition(themeAnchorRef.current)}
			>
				<p className="theme-picker-label">Accent</p>
				<ThemePicker
					value={accentPreset}
					onChange={(preset) => {
						onAccent(preset);
						onCloseTheme();
					}}
				/>
			</div>,
			document.body,
		);

	return (
		<>
			<div
				className="titlebar electrobun-webkit-app-region-drag"
				title="Drag to move window"
			>
				<h1 className="app-title">Soundboard</h1>
			</div>

			<header className="toolbar electrobun-webkit-app-region-no-drag">
				<div className="toolbar-actions electrobun-webkit-app-region-no-drag">
					<button type="button" className="btn-primary" onClick={onImport}>
						Import
					</button>
					<button type="button" className="btn-secondary" onClick={onStopAll}>
						Stop all
					</button>
				</div>

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
							checked={alwaysOnTop}
							onChange={(e) => onAlwaysOnTop(e.target.checked)}
						/>
						<span>On top</span>
					</label>

					<button
						ref={themeAnchorRef}
						type="button"
						className={`icon-btn theme-toggle electrobun-webkit-app-region-no-drag ${showThemePicker ? "active" : ""}`}
						onClick={(e) => {
							e.stopPropagation();
							onToggleTheme();
						}}
						onPointerDown={(e) => e.stopPropagation()}
						title="Accent color"
						aria-expanded={showThemePicker}
						aria-haspopup="true"
					>
						<span className="theme-toggle-icon" aria-hidden />
					</button>
				</div>
			</header>

			{popover}
		</>
	);
}

function getPopoverPosition(anchor: HTMLElement) {
	const rect = anchor.getBoundingClientRect();
	return {
		position: "fixed" as const,
		top: rect.bottom + 8,
		right: Math.max(12, window.innerWidth - rect.right),
		zIndex: 10000,
	};
}

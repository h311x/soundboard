import type { Clip } from "@shared/types";
import { useSliderCommit } from "../hooks/useSliderCommit";
import { formatHotkeyDisplay } from "../utils/hotkey";

/** Elements that must never initiate card reorder drag (WebKit ignores dragstart preventDefault on range inputs). */
const POINTER_DRAG_BLOCK =
	"button, input, label, a, .clip-footer, .clip-no-drag";

function pointerBlocksCardDrag(target: HTMLElement): boolean {
	return !!target.closest(POINTER_DRAG_BLOCK);
}

type Props = {
	clip: Clip;
	progress: number;
	isPlaying: boolean;
	onPlay: () => void;
	onStop: () => void;
	onEdit: () => void;
	onEditHotkey: () => void;
	onVolumePreview: (v: number) => void;
	onVolumeCommit: (v: number) => void;
	reorderState?: { dragging: boolean; dragOver: boolean };
	onReorderPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export function ClipPad({
	clip,
	progress,
	isPlaying,
	onPlay,
	onStop,
	onEdit,
	onEditHotkey,
	onVolumePreview,
	onVolumeCommit,
	reorderState,
	onReorderPointerDown,
}: Props) {
	const hasHotkey = Boolean(clip.hotkey);
	const volume = useSliderCommit(clip.volume, onVolumePreview, onVolumeCommit);

	const handlePadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (pointerBlocksCardDrag(e.target as HTMLElement)) return;
		onReorderPointerDown?.(e);
	};

	const isNestedAction = (el: HTMLElement, zone: HTMLElement) => {
		const action = el.closest("[role='button']");
		return action != null && action !== zone;
	};

	const handlePlayZoneClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (clip.missing) return;
		if (isNestedAction(e.target as HTMLElement, e.currentTarget)) return;
		onPlay();
	};

	const handlePlayZoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (clip.missing) return;
		if (e.key !== "Enter" && e.key !== " ") return;
		if (isNestedAction(e.target as HTMLElement, e.currentTarget)) return;
		e.preventDefault();
		onPlay();
	};

	return (
		<div
			data-clip-id={clip.id}
			className={`clip-pad glass-panel ${isPlaying ? "playing" : ""} ${progress >= 1 ? "played" : ""} ${clip.missing ? "missing" : ""} ${reorderState?.dragging ? "dragging" : ""} ${reorderState?.dragOver ? "drag-over" : ""}`}
			onPointerDown={handlePadPointerDown}
		>
			<div
				className="clip-play-zone"
				role="button"
				tabIndex={clip.missing ? -1 : 0}
				aria-disabled={clip.missing || undefined}
				aria-label={`Play ${clip.displayName}`}
				onClick={handlePlayZoneClick}
				onKeyDown={handlePlayZoneKeyDown}
			>
				<div className="clip-main">
					<div className="clip-body">
						<h3 className="clip-name">{clip.displayName}</h3>
						{hasHotkey ? (
							<span
								role="button"
								tabIndex={0}
								className="clip-hotkey-display clip-no-drag"
								onPointerDown={(e) => e.stopPropagation()}
								onClick={(e) => {
									e.stopPropagation();
									onEditHotkey();
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										e.stopPropagation();
										onEditHotkey();
									}
								}}
								title="Edit shortcut"
							>
								{formatHotkeyDisplay(clip.hotkey)}
							</span>
						) : (
							<span
								role="button"
								tabIndex={0}
								className="clip-hotkey-set clip-no-drag"
								onPointerDown={(e) => e.stopPropagation()}
								onClick={(e) => {
									e.stopPropagation();
									onEditHotkey();
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										e.stopPropagation();
										onEditHotkey();
									}
								}}
							>
								Set shortcut
							</span>
						)}
						{clip.missing && (
							<span className="clip-badge warn">Missing file</span>
						)}
					</div>
					<span className="clip-play-hint" aria-hidden>
						<svg viewBox="0 0 16 16" width="14" height="14">
							<path d="M5 3.5v9l7.5-4.5L5 3.5z" fill="currentColor" />
						</svg>
					</span>
				</div>
			</div>

			<div className="clip-progress-track" aria-hidden>
				<span
					className="clip-progress"
					style={{ width: `${Math.min(100, progress * 100)}%` }}
				/>
			</div>

			<div className="clip-footer clip-no-drag">
				<label
					className="clip-volume"
					onPointerDownCapture={(e) => e.stopPropagation()}
				>
					<span className="sr-only">Volume</span>
					<input
						type="range"
						min={0}
						max={1}
						step={0.01}
						value={volume.display}
						onInput={(e) => volume.onInput(Number(e.currentTarget.value))}
						onPointerUp={volume.commit}
						onPointerCancel={volume.commit}
						onKeyUp={volume.commit}
						className="clip-slider"
						onPointerDownCapture={(e) => e.stopPropagation()}
						onClick={(e) => e.stopPropagation()}
					/>
				</label>

				<div className="clip-actions">
					<button
						type="button"
						className="clip-action-btn clip-action-btn--stop"
						onClick={onStop}
						disabled={!isPlaying}
						title={isPlaying ? "Stop" : "Not playing"}
						aria-label={`Stop ${clip.displayName}`}
					>
						<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden>
							<rect x="2" y="2" width="8" height="8" rx="1" fill="currentColor" />
						</svg>
					</button>
					<button
						type="button"
						className="clip-action-btn"
						onClick={onEdit}
						title="Edit"
						aria-label={`Edit ${clip.displayName}`}
					>
						<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
							<path
								d="M11.5 2.5a1.4 1.4 0 0 1 2 2L5.8 12.2l-3 .8.8-3 8.9-8.5z"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.4"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}

import type { Clip } from "@shared/types";
import type { SliderCommit } from "../hooks/useSliderCommit";

const cancelDragPointer = (e: React.PointerEvent) => {
	e.stopPropagation();
};


export function ClipPadFooter({
	clip,
	volume,
	isPlaying,
	onStop,
	onEdit,
}: {
	clip: Clip;
	volume: SliderCommit;
	isPlaying: boolean;
	onStop: () => void;
	onEdit: () => void;
}) {
	return (
		<div className="clip-footer">
			<label className="clip-volume">
				<span className="sr-only">Volume</span>
				<input
					type="range"
					min={0}
					max={1}
					step={0.01}
					value={volume.display}
					onInput={(e) => volume.onInput(Number(e.currentTarget.value))}
					onChange={(e) => volume.onInput(Number(e.currentTarget.value))}
					onPointerUp={volume.commit}
					onPointerCancel={volume.commit}
					onKeyUp={volume.commit}
					className="clip-slider"
					onPointerDown={cancelDragPointer}
					onClick={(e) => e.stopPropagation()}
				/>
			</label>

			<div className="clip-actions">
				<button
					type="button"
					className="clip-action-btn clip-action-btn--stop"
					onPointerDown={cancelDragPointer}
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
					onPointerDown={cancelDragPointer}
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
	);
}

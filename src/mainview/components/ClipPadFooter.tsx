import type { Clip } from "@shared/types";
import type { SliderCommit } from "../hooks/useSliderCommit";
import { cn } from "../utils/cn";
import { ClipSlider } from "./ui/ClipSlider";

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
		<div className="relative z-[1] flex cursor-default items-center gap-2.5 px-3 pb-3.5 pt-2.5">
			<label className="min-w-0 flex-1">
				<span className="sr-only">Volume</span>
				<ClipSlider
					min={0}
					max={1}
					step={0.01}
					value={volume.display}
					onInput={(e) => volume.onInput(Number(e.currentTarget.value))}
					onChange={(e) => volume.onInput(Number(e.currentTarget.value))}
					onPointerUp={volume.commit}
					onPointerCancel={volume.commit}
					onKeyUp={volume.commit}
					onPointerDown={(e) => {
						volume.onPointerDown(e);
						cancelDragPointer(e);
					}}
					onClick={(e) => e.stopPropagation()}
				/>
			</label>

			<div className="flex shrink-0 gap-0.5 rounded-[10px] border border-white/[0.08] bg-black/[0.32] p-[3px] backdrop-blur-[10px]">
				<button
					type="button"
					className={cn(
						"inline-flex size-[30px] cursor-pointer items-center justify-center rounded-[7px] border-none bg-transparent p-0 text-[hsl(var(--accent-hsl)/0.9)] transition-[color,background] duration-150 hover:bg-[hsl(var(--accent-hsl)/0.25)] hover:text-white disabled:cursor-default disabled:opacity-30",
					)}
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
					className="inline-flex size-[30px] cursor-pointer items-center justify-center rounded-[7px] border-none bg-transparent p-0 text-[var(--text-muted)] transition-[color,background] duration-150 hover:bg-white/[0.08] hover:text-[var(--text-primary)]"
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

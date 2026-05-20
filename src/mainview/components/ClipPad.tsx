import type { Clip } from "@shared/types";
import type { ReactNode } from "react";
import type { SliderCommit } from "../hooks/useSliderCommit";
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CLIP_SORTABLE_TRANSITION } from "../app/clipSortableMotion";
import { useSliderCommit } from "../hooks/useSliderCommit";
import { ClipPadFooter } from "./ClipPadFooter";
import { ClipPadPlayZone } from "./ClipPadPlayZone";

export type ClipPadProps = {
	clip: Clip;
	progress: number;
	isPlaying: boolean;
	onPlay: () => void;
	onStop: () => void;
	onEdit: () => void;
	onEditHotkey: () => void;
	onVolumePreview: (v: number) => void;
	onVolumeCommit: (v: number) => void;
};

const cancelDragPointer = (e: React.PointerEvent) => {
	e.stopPropagation();
};

export function ClipPad(props: ClipPadProps) {
	const volume = useSliderCommit(
		props.clip.volume,
		props.onVolumePreview,
		props.onVolumeCommit,
	);

	return (
		<ClipPadSortable clipId={props.clip.id}>
			<ClipPadCard {...props} volume={volume} />
		</ClipPadSortable>
	);
}

function ClipPadSortable({
	clipId,
	children,
}: {
	clipId: string;
	children: ReactNode;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: clipId,
		transition: CLIP_SORTABLE_TRANSITION,
		animateLayoutChanges: defaultAnimateLayoutChanges,
	});

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
			className={`clip-sortable${isDragging ? " is-dragging" : ""}`}
			{...attributes}
			{...listeners}
		>
			{children}
		</div>
	);
}

function ClipPadCard({
	clip,
	progress,
	isPlaying,
	onPlay,
	onStop,
	onEdit,
	onEditHotkey,
	volume,
}: ClipPadProps & { volume: SliderCommit }) {
	return (
		<div data-clip-id={clip.id} className={clipPadClass(isPlaying, progress, clip.missing)}>
			<ClipPadPlayZone clip={clip} onPlay={onPlay} onEditHotkey={onEditHotkey} />
			<div className="clip-progress-track" aria-hidden>
				<span
					className="clip-progress"
					style={{ width: `${Math.min(100, progress * 100)}%` }}
				/>
			</div>
			<div
				onPointerDown={cancelDragPointer}
				onPointerDownCapture={cancelDragPointer}
			>
				<ClipPadFooter
					clip={clip}
					volume={volume}
					isPlaying={isPlaying}
					onStop={onStop}
					onEdit={onEdit}
				/>
			</div>
		</div>
	);
}

function clipPadClass(
	isPlaying: boolean,
	progress: number,
	missing?: boolean,
): string {
	return ["clip-pad", "glass-panel", stateClass(isPlaying, progress, missing)]
		.filter(Boolean)
		.join(" ");
}

function stateClass(
	isPlaying: boolean,
	progress: number,
	missing?: boolean,
): string {
	if (missing) return "missing";
	return playStateClass(isPlaying, progress);
}

function playStateClass(isPlaying: boolean, progress: number): string {
	if (isPlaying) return "playing";
	if (progress >= 1) return "played";
	return "";
}

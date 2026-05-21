import type { Clip } from "@shared/types";
import type { ReactNode } from "react";
import type { SliderCommit } from "../hooks/useSliderCommit";
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CLIP_SORTABLE_TRANSITION } from "../app/clipSortableMotion";
import { useSliderCommit } from "../hooks/useSliderCommit";
import { cn } from "../utils/cn";
import { ClipPadFooter } from "./ClipPadFooter";
import { ClipPadPlayZone } from "./ClipPadPlayZone";
import { GlassPanel } from "./ui/GlassPanel";

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
			className={cn(
				"min-w-0 w-full touch-none motion-reduce:transition-none",
				isDragging && "z-[2] [&_.clip-pad-card]:opacity-50 [&_.clip-pad-card]:border-[hsl(var(--accent-hsl)/0.5)] [&_.clip-pad-card]:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_22px_48px_rgba(0,0,0,0.55),0_0_0_1px_hsl(var(--accent-hsl)/0.35)]",
			)}
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
		<GlassPanel
			data-clip-id={clip.id}
			data-playing={isPlaying ? "true" : undefined}
			className={clipPadClass(isPlaying, clip.missing)}
		>
			<ClipPadPlayZone clip={clip} onPlay={onPlay} onEditHotkey={onEditHotkey} />
			<div
				className="relative z-[1] mx-3.5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]"
				aria-hidden
			>
				<span
					className={cn(
						"block h-full w-0 rounded-[inherit] bg-[linear-gradient(90deg,hsl(var(--accent-hsl)/0.45),hsl(var(--accent-hsl)/0.95))] shadow-[0_0_14px_hsl(var(--accent-hsl)/0.45)] transition-[width] duration-75 ease-linear",
						isPlaying && "shadow-[0_0_18px_hsl(var(--accent-hsl)/0.55)]",
					)}
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
		</GlassPanel>
	);
}

function clipPadClass(isPlaying: boolean, missing?: boolean): string {
	return cn(
		"clip-pad-card group isolate min-w-0 cursor-grab overflow-hidden rounded-[calc(var(--radius-lg)+2px)] border border-[hsl(var(--accent-hsl)/0.14)] bg-[linear-gradient(155deg,hsl(var(--accent-hsl)/0.1)_0%,rgba(255,255,255,0.05)_28%,rgba(8,8,12,0.55)_100%)] p-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_14px_36px_rgba(0,0,0,0.38)] transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,transparent_42%)] before:content-[''] hover:border-[hsl(var(--accent-hsl)/0.28)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_44px_rgba(0,0,0,0.45),0_0_0_1px_hsl(var(--accent-hsl)/0.08)] active:cursor-grabbing",
		isPlaying &&
			"border-[hsl(var(--accent-hsl)/0.45)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_hsl(var(--accent-hsl)/0.12),0_0_28px_hsl(var(--accent-hsl)/0.18),0_16px_40px_rgba(0,0,0,0.42)]",
		missing && "opacity-[0.55]",
	);
}

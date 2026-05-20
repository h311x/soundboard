import type { AppState, Clip, PlaybackSnapshot } from "@shared/types";
import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { audioEngine } from "../audio/engine";
import {
	clipIdsAfterDrag,
	clipIdsEqual,
	persistClipOrderIfChanged,
	pruneOrderOverride,
	resolveClipIds,
} from "../app/clipDrag";
import { getRpc } from "../rpc";
import { ClipPad } from "./ClipPad";

export type AppClipGridProps = {
	state: AppState;
	playback: PlaybackSnapshot;
	getState: () => AppState | null;
	applyState: (s: AppState) => Promise<void>;
	onPlay: (clip: Clip) => void;
	onEdit: (clip: Clip) => void;
	onEditHotkey: (clip: Clip) => void;
};

export function AppClipGrid({
	state,
	playback,
	applyState,
	onPlay,
	onEdit,
	onEditHotkey,
}: AppClipGridProps) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 200, tolerance: 6 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const serverClipIds = useMemo(
		() => state.board.clips.map((c) => c.id),
		[state.board.clips],
	);

	// Local order after drag until RPC updates serverClipIds (avoids sync effect
	// resetting to stale server order on unrelated parent re-renders).
	const [orderOverride, setOrderOverride] = useState<string[] | null>(null);
	const clipIds = useMemo(
		() => resolveClipIds(orderOverride, serverClipIds),
		[orderOverride, serverClipIds],
	);
	const clipIdsRef = useRef(clipIds);
	const serverClipIdsRef = useRef(serverClipIds);

	useEffect(() => {
		clipIdsRef.current = clipIds;
	}, [clipIds]);

	useEffect(() => {
		serverClipIdsRef.current = serverClipIds;
	}, [serverClipIds]);

	const clipsById = useMemo(
		() => new Map(state.board.clips.map((c) => [c.id, c] as const)),
		[state.board.clips],
	);

	const orderedClips = useMemo(
		() =>
			clipIds
				.map((id) => clipsById.get(id))
				.filter((clip): clip is Clip => clip != null),
		[clipIds, clipsById],
	);

	const handleDragStart = useCallback(() => {
		setOrderOverride((pending) =>
			pruneOrderOverride(pending, serverClipIdsRef.current),
		);
	}, []);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const next = clipIdsAfterDrag(event, clipIdsRef.current);
			if (next === null) return;
			if (clipIdsEqual(next, serverClipIdsRef.current)) return;
			setOrderOverride(next);
			persistClipOrderIfChanged(
				next,
				serverClipIdsRef.current,
				applyState,
			);
		},
		[applyState],
	);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToParentElement]}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<SortableContext items={clipIds} strategy={rectSortingStrategy}>
				<div className="clip-grid">
					{orderedClips.map((clip) => (
						<ClipPad
							key={clip.id}
							clip={clip}
							progress={playback.progress[clip.id] ?? 0}
							isPlaying={playback.playing[clip.id] ?? false}
							onPlay={() => onPlay(clip)}
							onStop={() => stopClip(clip, state)}
							onEdit={() => onEdit(clip)}
							onEditHotkey={() => onEditHotkey(clip)}
							onVolumePreview={(v) => previewClipVolume(clip.id, v, state)}
							onVolumeCommit={(v) => commitClipVolume(clip.id, v, applyState)}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}

function stopClip(clip: Clip, state: AppState): void {
	if (state.capabilities.hostAudio) {
		void getRpc().request.stopClipAudio({ id: clip.id });
		return;
	}
	audioEngine.stopClip(clip.id);
}

function previewClipVolume(clipId: string, volume: number, state: AppState): void {
	audioEngine.setClipVolume(clipId, volume);
	if (!state.capabilities.hostAudio) return;
	void getRpc().request.previewClipVolume({ id: clipId, volume });
}

function commitClipVolume(
	clipId: string,
	volume: number,
	applyState: (s: AppState) => Promise<void>,
): void {
	void getRpc().request.setClipVolume({ id: clipId, volume }).then(applyState);
}

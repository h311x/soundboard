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
import { useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { audioEngine } from "../audio/engine";
import {
	appStateWithClipOrder,
	appStateWithClipVolume,
	clipIdsAfterDrag,
	clipIdsEqual,
	persistClipOrderIfChanged,
} from "../app/clipDrag";
import { getRpc } from "../rpc";
import { ClipPad } from "./ClipPad";

export type AppClipGridProps = {
	state: AppState;
	playback: PlaybackSnapshot;
	getState: () => AppState | null;
	applyStateSync: (s: AppState) => void;
	onPlay: (clip: Clip) => void;
	onEdit: (clip: Clip) => void;
	onEditHotkey: (clip: Clip) => void;
};

export function AppClipGrid({
	state,
	playback,
	getState,
	applyStateSync,
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

	const clipIds = useMemo(
		() => state.board.clips.map((c) => c.id),
		[state.board.clips],
	);
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

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const serverIds = state.board.clips.map((c) => c.id);
			const next = clipIdsAfterDrag(event, serverIds);
			if (next === null) return;
			if (clipIdsEqual(next, serverIds)) return;

			// Commit DOM order before dnd-kit clears transforms (one-frame flash otherwise).
			flushSync(() => {
				const current = getState();
				if (current) applyStateSync(appStateWithClipOrder(current, next));
			});

			persistClipOrderIfChanged(next, serverIds);
		},
		[state.board.clips, getState, applyStateSync],
	);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToParentElement]}
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
							onVolumeCommit={(v) =>
								commitClipVolume(clip.id, v, getState, applyStateSync)
							}
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
	if (state.capabilities.hostAudio) {
		void getRpc().request.previewClipVolume({
			id: clipId,
			volume: volume * state.board.masterVolume,
		});
		return;
	}
	audioEngine.setClipVolume(clipId, volume);
}

function commitClipVolume(
	clipId: string,
	volume: number,
	getState: () => AppState | null,
	applyStateSync: (s: AppState) => void,
): void {
	const current = getState();
	if (current) applyStateSync(appStateWithClipVolume(current, clipId, volume));
	void getRpc().request.setClipVolume({ id: clipId, volume });
}

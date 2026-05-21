import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { AppState, Clip } from "@shared/types";

export function clipIdsAfterDrag(
	event: DragEndEvent,
	ids: string[],
): string[] | null {
	const { active, over } = event;
	if (!over || active.id === over.id) return null;
	return moveClipIds(ids, String(active.id), String(over.id));
}

export function moveClipIds(
	ids: string[],
	activeId: string,
	overId: string,
): string[] | null {
	const oldIndex = ids.indexOf(activeId);
	const newIndex = ids.indexOf(overId);
	if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return null;
	return arrayMove(ids, oldIndex, newIndex);
}

export function resolveClipIds(
	override: string[] | null,
	serverIds: string[],
): string[] {
	if (!override || orderOverrideStale(override, serverIds)) return serverIds;
	return override;
}

export function pruneOrderOverride(
	pending: string[] | null,
	serverIds: string[],
): string[] | null {
	if (!pending || orderOverrideStale(pending, serverIds)) return null;
	return pending;
}

export function appStateWithClipVolume(
	state: AppState,
	clipId: string,
	volume: number,
): AppState {
	const clamped = Math.max(0, Math.min(1, volume));
	return {
		...state,
		board: {
			...state.board,
			clips: state.board.clips.map((clip) =>
				clip.id === clipId ? { ...clip, volume: clamped } : clip,
			),
		},
	};
}

export function appStateWithMasterVolume(
	state: AppState,
	masterVolume: number,
): AppState {
	const clamped = Math.max(0, Math.min(1, masterVolume));
	return {
		...state,
		board: { ...state.board, masterVolume: clamped },
	};
}

export function appStateWithClipOrder(state: AppState, ids: string[]): AppState {
	const byId = new Map(state.board.clips.map((c) => [c.id, c] as const));
	const clips: Clip[] = [];
	const idSet = new Set(ids);

	for (const id of ids) {
		const clip = byId.get(id);
		if (clip) clips.push(clip);
	}
	for (const clip of state.board.clips) {
		if (!idSet.has(clip.id)) clips.push(clip);
	}

	return { ...state, board: { ...state.board, clips } };
}

export function clipIdsEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((id, i) => id === b[i]);
}

function orderOverrideStale(override: string[], serverIds: string[]): boolean {
	return (
		override.length !== serverIds.length || clipIdsEqual(override, serverIds)
	);
}

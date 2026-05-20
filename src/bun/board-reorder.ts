import type { BoardData, Clip } from "../shared/types";

export function reorderClipsInBoard(board: BoardData, ids: string[]): void {
	const byId = new Map(board.clips.map((c) => [c.id, c]));
	const reordered = clipsInOrder(ids, byId);
	appendUnlistedClips(board.clips, ids, reordered);
	board.clips = reordered;
}

function clipsInOrder(ids: string[], byId: Map<string, Clip>): Clip[] {
	const reordered: Clip[] = [];
	for (const id of ids) {
		const clip = byId.get(id);
		if (clip) reordered.push(clip);
	}
	return reordered;
}

function appendUnlistedClips(
	all: Clip[],
	ids: string[],
	reordered: Clip[],
): void {
	const idSet = new Set(ids);
	for (const clip of all) {
		if (!idSet.has(clip.id)) reordered.push(clip);
	}
}

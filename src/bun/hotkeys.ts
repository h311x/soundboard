import { GlobalShortcut } from "electrobun/bun";
import type { BrowserWindow } from "electrobun/bun";
import type { BoardData } from "../shared/types";
import { loadBoard } from "./config";
import { registerClipHotkey } from "./hotkey-register";

const registered = new Map<string, string>();

export function unregisterAllHotkeys(): void {
	GlobalShortcut.unregisterAll();
	registered.clear();
}

export async function syncHotkeys(
	win: BrowserWindow,
	board?: BoardData,
): Promise<void> {
	const data = board ?? (await loadBoard());
	unregisterAllHotkeys();

	for (const clip of data.clips) {
		registerClipHotkey(win, clip, registered);
	}
}

export function validateHotkey(
	board: BoardData,
	clipId: string,
	hotkey: string,
): string | null {
	if (!hotkey) return null;
	const boardConflict = findBoardHotkeyConflict(board, clipId, hotkey);
	if (boardConflict) return boardConflict;
	return findRegistryConflict(clipId, hotkey);
}

function findBoardHotkeyConflict(
	board: BoardData,
	clipId: string,
	hotkey: string,
): string | null {
	const conflict = board.clips.find(
		(clip) => clip.id !== clipId && clip.hotkey === hotkey,
	);
	if (!conflict) return null;
	return "Hotkey already used by another clip";
}

function findRegistryConflict(clipId: string, hotkey: string): string | null {
	const owner = registered.get(hotkey);
	if (!owner) return null;
	if (owner === clipId) return null;
	return "Hotkey already registered";
}

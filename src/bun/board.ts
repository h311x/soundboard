import { copyFile, unlink } from "node:fs/promises";
import { basename, extname } from "node:path";
import type { AppState, BoardData, Clip } from "../shared/types";
import {
	loadAppState,
	loadBoard,
	saveBoard,
	soundFilePath,
	validateClips,
	withBoardLock,
} from "./config";

const ALLOWED_EXT = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"]);

function newId(): string {
	return crypto.randomUUID();
}

function displayNameFromPath(path: string): string {
	const base = basename(path);
	const ext = extname(base);
	return base.slice(0, base.length - ext.length) || base;
}

async function copyToSounds(sourcePath: string): Promise<{
	fileName: string;
	displayName: string;
}> {
	const ext = extname(sourcePath).toLowerCase();
	if (!ALLOWED_EXT.has(ext)) {
		throw new Error(`Unsupported format: ${ext || "(none)"}`);
	}
	const id = newId();
	const fileName = `${id}${ext}`;
	await copyFile(sourcePath, soundFilePath(fileName));
	return { fileName, displayName: displayNameFromPath(sourcePath) };
}

export async function importPaths(paths: string[]): Promise<AppState> {
	return withBoardLock(async () => {
	const board = await loadBoard();
	for (const path of paths) {
		try {
			const { fileName, displayName } = await copyToSounds(path);
			board.clips.push({
				id: newId(),
				displayName,
				fileName,
				hotkey: "",
				volume: 1,
				color: null,
			});
		} catch (e) {
			console.error("Import failed:", path, e);
		}
	}
	await saveBoard(board);
	await validateClips(board);
	return loadAppState();
	});
}

export async function importFileData(
	files: { name: string; data: number[] }[],
): Promise<AppState> {
	return withBoardLock(async () => {
	const board = await loadBoard();
	for (const file of files) {
		const ext = extname(file.name).toLowerCase();
		if (!ALLOWED_EXT.has(ext)) continue;
		const id = newId();
		const fileName = `${id}${ext}`;
		await Bun.write(soundFilePath(fileName), new Uint8Array(file.data));
		board.clips.push({
			id: newId(),
			displayName: displayNameFromPath(file.name),
			fileName,
			hotkey: "",
			volume: 1,
			color: null,
		});
	}
	await saveBoard(board);
	await validateClips(board);
	return loadAppState();
	});
}

export async function renameClip(
	id: string,
	displayName: string,
): Promise<AppState> {
	return withBoardLock(async () => {
	const board = await loadBoard();
	const clip = board.clips.find((c) => c.id === id);
	if (clip) clip.displayName = displayName.trim() || clip.displayName;
	await saveBoard(board);
	return loadAppState();
	});
}

export async function deleteClip(id: string): Promise<AppState> {
	return withBoardLock(async () => {
	const board = await loadBoard();
	const clip = board.clips.find((c) => c.id === id);
	if (clip) {
		try {
			await unlink(soundFilePath(clip.fileName));
		} catch {
			/* file may already be gone */
		}
		board.clips = board.clips.filter((c) => c.id !== id);
	}
	await saveBoard(board);
	return loadAppState();
	});
}

export async function reorderClips(ids: string[]): Promise<AppState> {
	return withBoardLock(async () => {
	const board = await loadBoard();
	const byId = new Map(board.clips.map((c) => [c.id, c]));
	const reordered: Clip[] = [];
	for (const id of ids) {
		const clip = byId.get(id);
		if (clip) reordered.push(clip);
	}
	for (const clip of board.clips) {
		if (!ids.includes(clip.id)) reordered.push(clip);
	}
	board.clips = reordered;
	await saveBoard(board);
	return loadAppState();
	});
}

export async function setClipVolume(
	id: string,
	volume: number,
): Promise<AppState> {
	return withBoardLock(async () => {
	const board = await loadBoard();
	const clip = board.clips.find((c) => c.id === id);
	if (clip) clip.volume = Math.max(0, Math.min(1, volume));
	await saveBoard(board);
	return loadAppState();
	});
}

export async function setMasterVolume(volume: number): Promise<AppState> {
	return withBoardLock(async () => {
	const board = await loadBoard();
	board.masterVolume = Math.max(0, Math.min(1, volume));
	await saveBoard(board);
	return loadAppState();
	});
}

export async function readSoundBytes(fileName: string): Promise<number[]> {
	const file = Bun.file(soundFilePath(fileName));
	if (!(await file.exists())) throw new Error("Sound file not found");
	const buf = await file.arrayBuffer();
	return Array.from(new Uint8Array(buf));
}

export async function updateBoard(
	mutate: (board: BoardData) => void,
): Promise<AppState> {
	return withBoardLock(async () => {
	const board = await loadBoard();
	mutate(board);
	await saveBoard(board);
	await validateClips(board);
	return loadAppState();
	});
}

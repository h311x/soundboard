import { basename, extname } from "node:path";
import type { AccentPresetId, BoardData, SettingsData } from "../shared/types";

export const DEFAULT_WINDOW = { x: 100, y: 100, width: 520, height: 680 };

const SOUND_EXT = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"]);

export function migrateBoard(board: BoardData): BoardData {
	ensureBoardVersion(board);
	ensureBoardClips(board);
	ensureBoardMasterVolume(board);
	migrateAllClips(board.clips);
	return board;
}

function ensureBoardVersion(board: BoardData): void {
	if (!board.version) board.version = 1;
}

function ensureBoardClips(board: BoardData): void {
	if (!Array.isArray(board.clips)) board.clips = [];
}

function ensureBoardMasterVolume(board: BoardData): void {
	if (typeof board.masterVolume !== "number") board.masterVolume = 1;
}

function migrateAllClips(clips: BoardData["clips"]): void {
	for (const clip of clips) migrateClipFields(clip);
}

function migrateClipFields(clip: BoardData["clips"][number]): void {
	normalizeClipVolume(clip);
	normalizeClipHotkey(clip);
	normalizeClipColor(clip);
}

function normalizeClipVolume(clip: BoardData["clips"][number]): void {
	if (typeof clip.volume !== "number") clip.volume = 1;
}

function normalizeClipHotkey(clip: BoardData["clips"][number]): void {
	if (!clip.hotkey) clip.hotkey = "";
}

function normalizeClipColor(clip: BoardData["clips"][number]): void {
	if (clip.color === undefined) clip.color = null;
}

export function migrateSettings(settings: Partial<SettingsData>): SettingsData {
	return {
		accentPreset: (settings.accentPreset as AccentPresetId) ?? "gray",
		window: { ...DEFAULT_WINDOW, ...settings.window },
		alwaysOnTop: settings.alwaysOnTop ?? false,
	};
}

export function isSoundFileName(fileName: string): boolean {
	return SOUND_EXT.has(extname(fileName).toLowerCase());
}

export function clipFromSoundFile(fileName: string): BoardData["clips"][number] {
	const ext = extname(fileName);
	return {
		id: crypto.randomUUID(),
		displayName: basename(fileName, ext) || fileName,
		fileName,
		hotkey: "",
		volume: 1,
		color: null,
	};
}

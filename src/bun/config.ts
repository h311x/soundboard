import { Utils } from "electrobun/bun";
import { mkdir, readdir, rename } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import type {
	AccentPresetId,
	AppState,
	BoardData,
	SettingsData,
} from "../shared/types";

const BOARD_FILE = "board.json";
const SETTINGS_FILE = "settings.json";
const SOUNDS_DIR = "sounds";

const DEFAULT_WINDOW = { x: 100, y: 100, width: 520, height: 680 };

const SOUND_EXT = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"]);

const DEFAULT_BOARD: BoardData = {
	version: 1,
	masterVolume: 1,
	clips: [],
};

const DEFAULT_SETTINGS: SettingsData = {
	accentPreset: "gray",
	window: DEFAULT_WINDOW,
	alwaysOnTop: false,
};

export function getUserDataDir(): string {
	return Utils.paths.userData;
}

export function getSoundsDir(): string {
	return join(getUserDataDir(), SOUNDS_DIR);
}

export async function ensureDirs(): Promise<void> {
	await mkdir(getUserDataDir(), { recursive: true });
	await mkdir(getSoundsDir(), { recursive: true });
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
	const file = Bun.file(path);
	if (!(await file.exists())) return fallback;
	try {
		return (await file.json()) as T;
	} catch {
		return fallback;
	}
}

async function writeJson(path: string, data: unknown): Promise<void> {
	const tmp = `${path}.tmp`;
	await Bun.write(tmp, JSON.stringify(data, null, 2));
	await rename(tmp, path);
}

let boardMutation: Promise<void> = Promise.resolve();

/** Serialize board read-modify-write to avoid races from rapid slider updates. */
export function withBoardLock<T>(fn: () => Promise<T>): Promise<T> {
	const run = boardMutation.then(fn);
	boardMutation = run.then(
		() => undefined,
		() => undefined,
	);
	return run;
}

function migrateBoard(board: BoardData): BoardData {
	if (!board.version) board.version = 1;
	if (!Array.isArray(board.clips)) board.clips = [];
	if (typeof board.masterVolume !== "number") board.masterVolume = 1;
	for (const clip of board.clips) {
		if (typeof clip.volume !== "number") clip.volume = 1;
		if (!clip.hotkey) clip.hotkey = "";
		if (clip.color === undefined) clip.color = null;
	}
	return board;
}

function migrateSettings(settings: Partial<SettingsData>): SettingsData {
	return {
		accentPreset: (settings.accentPreset as AccentPresetId) ?? "gray",
		window: { ...DEFAULT_WINDOW, ...settings.window },
		alwaysOnTop: settings.alwaysOnTop ?? false,
	};
}

async function recoverClipsFromSounds(board: BoardData): Promise<void> {
	if (board.clips.length > 0) return;
	await ensureDirs();
	let entries: string[];
	try {
		entries = await readdir(getSoundsDir());
	} catch {
		return;
	}
	for (const fileName of entries) {
		const ext = extname(fileName).toLowerCase();
		if (!SOUND_EXT.has(ext)) continue;
		board.clips.push({
			id: crypto.randomUUID(),
			displayName: basename(fileName, ext) || fileName,
			fileName,
			hotkey: "",
			volume: 1,
			color: null,
		});
	}
	if (board.clips.length > 0) {
		console.warn(
			`Recovered ${board.clips.length} clip(s) from sounds folder (board was empty)`,
		);
		await saveBoard(board);
	}
}

export async function loadBoard(): Promise<BoardData> {
	const path = join(getUserDataDir(), BOARD_FILE);
	const board = migrateBoard(await readJson(path, DEFAULT_BOARD));
	await recoverClipsFromSounds(board);
	await validateClips(board);
	return board;
}

export async function loadSettings(): Promise<SettingsData> {
	const path = join(getUserDataDir(), SETTINGS_FILE);
	return migrateSettings(await readJson(path, DEFAULT_SETTINGS));
}

export async function saveBoard(board: BoardData): Promise<void> {
	await writeJson(join(getUserDataDir(), BOARD_FILE), board);
}

export async function saveSettings(settings: SettingsData): Promise<void> {
	await writeJson(join(getUserDataDir(), SETTINGS_FILE), settings);
}

export async function loadAppState(): Promise<AppState> {
	await ensureDirs();
	return {
		board: await loadBoard(),
		settings: await loadSettings(),
	};
}

export async function validateClips(board: BoardData): Promise<void> {
	const soundsDir = getSoundsDir();
	for (const clip of board.clips) {
		const file = Bun.file(join(soundsDir, clip.fileName));
		clip.missing = !(await file.exists());
	}
}

export function soundFilePath(fileName: string): string {
	return join(getSoundsDir(), fileName);
}

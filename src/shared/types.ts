import type { RPCSchema } from "electrobun/bun";

export type AccentPresetId =
	| "gray"
	| "slate"
	| "violet"
	| "blue"
	| "teal"
	| "amber";

export type Clip = {
	id: string;
	displayName: string;
	fileName: string;
	hotkey: string;
	volume: number;
	color: string | null;
	missing?: boolean;
};

export type BoardData = {
	version: number;
	masterVolume: number;
	clips: Clip[];
};

export type WindowState = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type SettingsData = {
	accentPreset: AccentPresetId;
	window: WindowState;
	alwaysOnTop: boolean;
};

export type AppState = {
	board: BoardData;
	settings: SettingsData;
};

export type UpdateInfo = {
	updateAvailable: boolean;
	updateReady: boolean;
	version?: string;
	error?: string;
};

export type SoundboardRPC = {
	bun: RPCSchema<{
		requests: {
			getState: { params: Record<string, never>; response: AppState };
			importViaDialog: { params: Record<string, never>; response: AppState };
			importPaths: { params: { paths: string[] }; response: AppState };
			importFileData: {
				params: {
					files: { name: string; data: number[] }[];
				};
				response: AppState;
			};
			renameClip: {
				params: { id: string; displayName: string };
				response: AppState;
			};
			deleteClip: { params: { id: string }; response: AppState };
			reorderClips: { params: { ids: string[] }; response: AppState };
			setClipVolume: {
				params: { id: string; volume: number };
				response: AppState;
			};
			setMasterVolume: { params: { volume: number }; response: AppState };
			setClipHotkey: {
				params: { id: string; hotkey: string };
				response: { ok: boolean; error?: string; state: AppState };
			};
			setAccentPreset: {
				params: { preset: AccentPresetId };
				response: AppState;
			};
			setAlwaysOnTop: { params: { enabled: boolean }; response: AppState };
			readSoundFile: { params: { fileName: string }; response: number[] };
			checkForUpdates: { params: Record<string, never>; response: UpdateInfo };
			downloadUpdate: { params: Record<string, never>; response: UpdateInfo };
			applyUpdate: { params: Record<string, never>; response: void };
			saveWindowBounds: { params: WindowState; response: void };
		};
		messages: Record<string, never>;
	}>;
	webview: RPCSchema<{
		requests: Record<string, never>;
		messages: {
			playClip: { id: string };
			stopAll: Record<string, never>;
			stateChanged: { state: AppState };
			showToast: { message: string; variant?: "info" | "error" };
			hotkeyPlay: { id: string };
		};
	}>;
};

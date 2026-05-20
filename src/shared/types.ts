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

export type PlatformCapabilities = {
	/** Play from bun.exe on Windows so audio routing apps see "Soundboard". */
	hostAudio: boolean;
};

export type PlaybackSnapshot = {
	progress: Record<string, number>;
	playing: Record<string, boolean>;
};

export type AppState = {
	board: BoardData;
	settings: SettingsData;
	capabilities: PlatformCapabilities;
};

export type UpdateInfo = {
	updateAvailable: boolean;
	updateReady: boolean;
	version?: string;
	error?: string;
};

export type UpdateDownloadState = UpdateInfo & {
	downloading: boolean;
	statusMessage?: string;
};

export type BeginDownloadResult = {
	started: boolean;
	alreadyDownloading: boolean;
	state: UpdateDownloadState;
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
			beginDownloadUpdate: {
				params: Record<string, never>;
				response: BeginDownloadResult;
			};
			getDownloadStatus: {
				params: Record<string, never>;
				response: UpdateDownloadState;
			};
			applyUpdate: { params: Record<string, never>; response: void };
			saveWindowBounds: { params: WindowState; response: void };
			playClipAudio: {
				params: { id: string };
				response: { ok: boolean; error?: string };
			};
			stopAllAudio: { params: Record<string, never>; response: void };
			stopClipAudio: { params: { id: string }; response: void };
			minimizeWindow: { params: Record<string, never>; response: void };
			closeWindow: { params: Record<string, never>; response: void };
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
			relayout: Record<string, never>;
			playbackSnapshot: PlaybackSnapshot;
			updateDownloadProgress: UpdateDownloadState;
		};
	}>;
};

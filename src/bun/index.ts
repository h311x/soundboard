import Electrobun, {
	BrowserView,
	BrowserWindow,
	Updater,
	Utils,
} from "electrobun/bun";
import type { SoundboardRPC } from "../shared/types";
import type { WindowState } from "../shared/types";
import * as boardOps from "./board";
import {
	loadAppState,
	loadSettings,
	saveSettings,
} from "./config";
import { syncHotkeys, unregisterAllHotkeys, validateHotkey } from "./hotkeys";
import {
	beginDownloadUpdateForApp,
	checkForUpdatesForApp,
	getDownloadStatusForApp,
	initUpdaterNotifications,
} from "./updater";
import {
	playClipOnHost,
	previewClipVolumeOnHost,
	previewMasterVolumeOnHost,
	stopAllOnHost,
	stopClipOnHost,
} from "./host-playback";
import { notifyState, sendToWebview } from "./webview-messages";
import { refreshWebviewLayout } from "./webview-layout";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function getMainViewUrl(): Promise<string> {
	const { channel } = await Updater.getLocalInfo();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR: ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log("Vite not running — using bundled views");
		}
	}
	return "views://mainview/index.html";
}

// Assigned after RPC handlers are defined (handlers close over this reference).
// eslint-disable-next-line prefer-const -- must be `let`; `const` is invalid before assignment
let mainWindow: BrowserWindow;

const rpc = BrowserView.defineRPC<SoundboardRPC>({
	maxRequestTime: 120_000,
	handlers: {
		requests: {
			getState: async () => loadAppState(),
			importViaDialog: async () => {
				const paths = await Utils.openFileDialog({
					allowedFileTypes: "mp3,wav,ogg,m4a,aac,webm",
					allowsMultipleSelection: true,
					canChooseFiles: true,
					canChooseDirectory: false,
				});
				if (!paths?.length) return loadAppState();
				const state = await boardOps.importPaths(paths);
				await syncHotkeys(mainWindow, state.board);
				notifyState(mainWindow, state);
				return state;
			},
			importPaths: async ({ paths }) => {
				const state = await boardOps.importPaths(paths);
				await syncHotkeys(mainWindow, state.board);
				notifyState(mainWindow, state);
				return state;
			},
			importFileData: async ({ files }) => {
				const state = await boardOps.importFileData(files);
				await syncHotkeys(mainWindow, state.board);
				notifyState(mainWindow, state);
				return state;
			},
			renameClip: async ({ id, displayName }) => {
				const state = await boardOps.renameClip(id, displayName);
				notifyState(mainWindow, state);
				return state;
			},
			deleteClip: async ({ id }) => {
				const state = await boardOps.deleteClip(id);
				await syncHotkeys(mainWindow, state.board);
				notifyState(mainWindow, state);
				return state;
			},
			reorderClips: async ({ ids }) => {
				const state = await boardOps.reorderClips(ids);
				notifyState(mainWindow, state);
				return state;
			},
			setClipVolume: async ({ id, volume }) => {
				const state = await boardOps.setClipVolume(id, volume);
				notifyState(mainWindow, state);
				return state;
			},
			previewClipVolume: async ({ id, volume }) => {
				await previewClipVolumeOnHost(id, volume);
			},
			setMasterVolume: async ({ volume }) => {
				const state = await boardOps.setMasterVolume(volume);
				notifyState(mainWindow, state);
				return state;
			},
			previewMasterVolume: async ({ volume }) => {
				await previewMasterVolumeOnHost(volume);
			},
			setClipHotkey: async ({ id, hotkey }) => {
				const board = (await loadAppState()).board;
				const err = validateHotkey(board, id, hotkey);
				if (err) {
					return { ok: false, error: err, state: await loadAppState() };
				}
				const state = await boardOps.updateBoard((b) => {
					const c = b.clips.find((x) => x.id === id);
					if (c) c.hotkey = hotkey;
				});
				await syncHotkeys(mainWindow, state.board);
				notifyState(mainWindow, state);
				return { ok: true, state };
			},
			setAccentPreset: async ({ preset }) => {
				const settings = await loadSettings();
				settings.accentPreset = preset;
				await saveSettings(settings);
				const state = await loadAppState();
				notifyState(mainWindow, state);
				return state;
			},
			setAlwaysOnTop: async ({ enabled }) => {
				const settings = await loadSettings();
				settings.alwaysOnTop = enabled;
				await saveSettings(settings);
				mainWindow.setAlwaysOnTop(enabled);
				const state = await loadAppState();
				notifyState(mainWindow, state);
				return state;
			},
			readSoundFile: async ({ fileName }) => boardOps.readSoundBytes(fileName),
			checkForUpdates: async () => checkForUpdatesForApp(),
			beginDownloadUpdate: async () => beginDownloadUpdateForApp(),
			getDownloadStatus: async () => getDownloadStatusForApp(),
			applyUpdate: async () => {
				if (Updater.updateInfo()?.updateReady) {
					await Updater.applyUpdate();
				}
			},
			saveWindowBounds: async (bounds) => {
				const settings = await loadSettings();
				settings.window = bounds;
				await saveSettings(settings);
			},
			playClipAudio: async ({ id }) => playClipOnHost(mainWindow, id),
			stopAllAudio: async () => {
				await stopAllOnHost(mainWindow);
			},
			stopClipAudio: async ({ id }) => {
				await stopClipOnHost(mainWindow, id);
			},
			minimizeWindow: () => {
				mainWindow.minimize();
			},
			closeWindow: () => {
				mainWindow.close();
			},
		},
		messages: {},
	},
});

const settings = await loadSettings();
const url = await getMainViewUrl();
const isMac = process.platform === "darwin";
const isLinux = process.platform === "linux";

mainWindow = new BrowserWindow({
	title: "Soundboard",
	url,
	rpc,
	frame: {
		...settings.window,
	},
	// Windows: native frame (resize + system caption buttons). Custom frameless chrome
	// cannot replace DWM resize borders in Electrobun; toolbar stays no-drag for sliders.
	titleBarStyle: isMac ? "hiddenInset" : "default",
	transparent: isMac,
	renderer: isLinux ? "cef" : "native",
});

mainWindow.setAlwaysOnTop(settings.alwaysOnTop);

initUpdaterNotifications((state) => {
	sendToWebview(mainWindow, "updateDownloadProgress", state);
});

let saveBoundsTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSaveBounds() {
	if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
	saveBoundsTimer = setTimeout(() => {
		const frame = mainWindow.getFrame();
		const bounds: WindowState = {
			x: frame.x,
			y: frame.y,
			width: frame.width,
			height: frame.height,
		};
		saveSettings({
			...settings,
			window: bounds,
		}).catch(console.error);
	}, 400);
}

mainWindow.on("resize", scheduleSaveBounds);
mainWindow.on("move", scheduleSaveBounds);

Electrobun.events.on("before-quit", async () => {
	const frame = mainWindow.getFrame();
	const s = await loadSettings();
	s.window = {
		x: frame.x,
		y: frame.y,
		width: frame.width,
		height: frame.height,
	};
	s.alwaysOnTop = mainWindow.isAlwaysOnTop();
	await saveSettings(s);
	unregisterAllHotkeys();
});

await syncHotkeys(mainWindow);

mainWindow.webview.on("dom-ready", async () => {
	refreshWebviewLayout(mainWindow);

	const state = await loadAppState();
	notifyState(mainWindow, state);

	try {
		await Updater.checkForUpdate();
	} catch (e) {
		console.error("Update check failed:", e);
	}
});

console.log("Soundboard started");

import Electrobun, {
	BrowserView,
	BrowserWindow,
	Updater,
	Utils,
} from "electrobun/bun";
import type { SoundboardRPC } from "../shared/types";
import type { AccentPresetId, WindowState } from "../shared/types";
import * as boardOps from "./board";
import {
	loadAppState,
	loadSettings,
	saveSettings,
} from "./config";
import { syncHotkeys, unregisterAllHotkeys, validateHotkey } from "./hotkeys";
import { checkForUpdatesForApp, downloadUpdateForApp } from "./updater";
import { playClipOnHost, stopAllOnHost, stopClipOnHost } from "./host-playback";
import { applyBundledWindowIcon, scheduleBundledWindowIcon } from "./win-icon";
import { notifyState, sendToWebview } from "./webview-messages";

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

let mainWindow: BrowserWindow;

const rpc = BrowserView.defineRPC<SoundboardRPC>({
	// Full update downloads can exceed 30s on slow links (first click was timing out).
	maxRequestTime: 600_000,
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
			setMasterVolume: async ({ volume }) => {
				const state = await boardOps.setMasterVolume(volume);
				notifyState(mainWindow, state);
				return state;
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
				settings.accentPreset = preset as AccentPresetId;
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
			downloadUpdate: async () => downloadUpdateForApp(),
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
			minimizeWindow: async () => {
				mainWindow.minimize();
			},
			closeWindow: async () => {
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
const isWin = process.platform === "win32";

mainWindow = new BrowserWindow({
	title: "Soundboard",
	url,
	rpc,
	frame: {
		...settings.window,
	},
	titleBarStyle: isMac ? "hiddenInset" : isWin ? "hidden" : "default",
	transparent: isMac,
	renderer: isLinux ? "cef" : "native",
});

mainWindow.setAlwaysOnTop(settings.alwaysOnTop);

void applyBundledWindowIcon(mainWindow);
scheduleBundledWindowIcon(mainWindow);

let saveBoundsTimer: ReturnType<typeof setTimeout> | null = null;
let relayoutTimer: ReturnType<typeof setTimeout> | null = null;

function refreshNativeFrame() {
	const frame = mainWindow.getFrame();
	mainWindow.setFrame(frame.x, frame.y, frame.width, frame.height);
}

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

function notifyWebviewRelayout() {
	if (relayoutTimer) clearTimeout(relayoutTimer);
	relayoutTimer = setTimeout(() => {
		refreshNativeFrame();
		sendToWebview(mainWindow, "relayout", {});
	}, 50);
}

function notifyWebviewRelayoutBurst() {
	notifyWebviewRelayout();
	for (const ms of [150, 400]) {
		setTimeout(() => sendToWebview(mainWindow, "relayout", {}), ms);
	}
}

mainWindow.on("resize", () => {
	scheduleSaveBounds();
	notifyWebviewRelayout();
	void applyBundledWindowIcon(mainWindow);
});
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
	await applyBundledWindowIcon(mainWindow);
	scheduleBundledWindowIcon(mainWindow);
	refreshNativeFrame();
	notifyWebviewRelayoutBurst();

	const state = await loadAppState();
	notifyState(mainWindow, state);

	try {
		await Updater.checkForUpdate();
	} catch (e) {
		console.error("Update check failed:", e);
	}
});

console.log("Soundboard started");

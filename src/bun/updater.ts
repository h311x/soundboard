import { Updater } from "electrobun/bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { UpdateDownloadState, UpdateInfo } from "../shared/types";

let downloadTask: Promise<UpdateInfo> | null = null;
let lastStatusMessage = "";
let progressListener: ((state: UpdateDownloadState) => void) | null = null;

function toUpdateInfo(
	info: NonNullable<ReturnType<typeof Updater.updateInfo>>,
): UpdateInfo {
	return {
		updateAvailable: info.updateAvailable,
		updateReady: info.updateReady,
		version: info.version,
		error: info.error,
	};
}

function tarPathForHash(appDataFolder: string, hash: string): string {
	return join(appDataFolder, "self-extraction", `${hash}.tar`);
}

/** Electrobun may leave updateReady false while the tar exists (Bun.file().exists cache). */
async function applyTarReadyFix(
	info: NonNullable<ReturnType<typeof Updater.updateInfo>>,
): Promise<NonNullable<ReturnType<typeof Updater.updateInfo>>> {
	if (info.updateReady || !info.updateAvailable || !info.hash) return info;

	const appDataFolder = await Updater.appDataFolder();
	if (existsSync(tarPathForHash(appDataFolder, info.hash))) {
		info.updateReady = true;
		info.error = "";
	}
	return info;
}

async function readUpdateInfo(): Promise<UpdateInfo> {
	const raw = Updater.updateInfo();
	if (!raw) return { updateAvailable: false, updateReady: false };
	const fixed = await applyTarReadyFix(raw);
	return toUpdateInfo(fixed);
}

function pushProgress(state: UpdateInfo, statusMessage?: string) {
	if (statusMessage) lastStatusMessage = statusMessage;
	progressListener?.({
		...state,
		downloading: downloadTask !== null,
		statusMessage: lastStatusMessage || undefined,
	});
}

async function runDownload(): Promise<UpdateInfo> {
	try {
		await Updater.downloadUpdate();
	} catch (e) {
		const partial = Updater.updateInfo();
		const result: UpdateInfo = {
			updateAvailable: partial?.updateAvailable ?? true,
			updateReady: false,
			version: partial?.version,
			error: e instanceof Error ? e.message : "Download failed",
		};
		pushProgress(result, result.error ?? "Download failed");
		return result;
	}

	const result = await readUpdateInfo();
	const message = result.updateReady
		? "Update ready to install"
		: result.error || lastStatusMessage || "Download finished";
	pushProgress(result, message);
	return result;
}

export function initUpdaterNotifications(
	onProgress: (state: UpdateDownloadState) => void,
) {
	progressListener = onProgress;

	Updater.onStatusChange((entry) => {
		lastStatusMessage = entry.message;
		void readUpdateInfo().then((state) => {
			pushProgress(state, entry.message);
		});
	});
}

export function isUpdateDownloading(): boolean {
	return downloadTask !== null;
}

export async function getDownloadStatusForApp(): Promise<UpdateDownloadState> {
	const state = await readUpdateInfo();
	return {
		...state,
		downloading: downloadTask !== null,
		statusMessage: lastStatusMessage || undefined,
	};
}

export type BeginDownloadResult = {
	started: boolean;
	alreadyDownloading: boolean;
	state: UpdateDownloadState;
};

export async function beginDownloadUpdateForApp(): Promise<BeginDownloadResult> {
	const current = await getDownloadStatusForApp();

	if (current.updateReady) {
		return { started: false, alreadyDownloading: false, state: current };
	}

	if (downloadTask) {
		return {
			started: false,
			alreadyDownloading: true,
			state: current,
		};
	}

	lastStatusMessage = "Starting download…";
	pushProgress(current, lastStatusMessage);

	downloadTask = runDownload().finally(() => {
		downloadTask = null;
	});

	return {
		started: true,
		alreadyDownloading: false,
		state: await getDownloadStatusForApp(),
	};
}

export async function checkForUpdatesForApp(): Promise<UpdateInfo> {
	const info = await Updater.checkForUpdate();
	if (!info) return { updateAvailable: false, updateReady: false };
	return toUpdateInfo(info);
}

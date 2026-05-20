import { Updater } from "electrobun/bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
	BeginDownloadResult,
	UpdateDownloadState,
	UpdateInfo,
} from "../shared/types";

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
	if (shouldSkipTarReadyFix(info)) return info;
	return markTarReadyWhenCached(info);
}

function shouldSkipTarReadyFix(
	info: NonNullable<ReturnType<typeof Updater.updateInfo>>,
): boolean {
	if (info.updateReady) return true;
	if (!info.updateAvailable) return true;
	return !info.hash;
}

async function markTarReadyWhenCached(
	info: NonNullable<ReturnType<typeof Updater.updateInfo>>,
): Promise<NonNullable<ReturnType<typeof Updater.updateInfo>>> {
	if (!info.hash) return info;
	const appDataFolder = await Updater.appDataFolder();
	if (!existsSync(tarPathForHash(appDataFolder, info.hash))) return info;
	info.updateReady = true;
	info.error = "";
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
	progressListener?.(downloadStateFromInfo(state, statusMessage));
}

function downloadStateFromInfo(
	state: UpdateInfo,
	statusMessage?: string,
): UpdateDownloadState {
	const downloading = downloadTask !== null;
	const message = statusMessage ?? lastStatusMessage;
	if (message === undefined) return { ...state, downloading };
	return { ...state, downloading, statusMessage: message };
}

function downloadFailureResult(
	error: unknown,
	partial: ReturnType<typeof Updater.updateInfo>,
): UpdateInfo {
	return {
		updateAvailable: failureUpdateAvailable(partial),
		updateReady: false,
		version: partial?.version,
		error: downloadErrorMessage(error),
	};
}

function failureUpdateAvailable(
	partial: ReturnType<typeof Updater.updateInfo>,
): boolean {
	if (partial?.updateAvailable) return true;
	return true;
}

function downloadErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return "Download failed";
}

function downloadSuccessMessage(result: UpdateInfo): string {
	if (result.updateReady) return "Update ready to install";
	return fallbackDownloadMessage(result);
}

function fallbackDownloadMessage(result: UpdateInfo): string {
	if (result.error) return result.error;
	if (lastStatusMessage) return lastStatusMessage;
	return "Download finished";
}

async function runDownload(): Promise<UpdateInfo> {
	try {
		await Updater.downloadUpdate();
	} catch (e) {
		const result = downloadFailureResult(e, Updater.updateInfo());
		pushProgress(result, result.error ?? "Download failed");
		return result;
	}

	const result = await readUpdateInfo();
	pushProgress(result, downloadSuccessMessage(result));
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

export async function getDownloadStatusForApp(): Promise<UpdateDownloadState> {
	const state = await readUpdateInfo();
	return downloadStateFromInfo(state);
}

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

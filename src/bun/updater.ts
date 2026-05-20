import { Updater } from "electrobun/bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { UpdateInfo } from "../shared/types";

const TAR_POLL_MS = 250;
const TAR_POLL_MAX_MS = 120_000;

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

/**
 * Electrobun's downloadUpdate() can finish writing the tar but leave updateReady false
 * because it re-checks with Bun.file().exists(), which caches a stale false (Updater.ts ~727).
 */
async function waitForTarFile(
	appDataFolder: string,
	hash: string,
): Promise<boolean> {
	const path = tarPathForHash(appDataFolder, hash);
	const deadline = Date.now() + TAR_POLL_MAX_MS;
	while (Date.now() < deadline) {
		if (existsSync(path)) return true;
		await Bun.sleep(TAR_POLL_MS);
	}
	return existsSync(path);
}

export async function downloadUpdateForApp(): Promise<UpdateInfo> {
	await Updater.downloadUpdate();
	const info = Updater.updateInfo();
	if (!info) {
		return { updateAvailable: false, updateReady: false };
	}

	if (!info.updateReady && info.updateAvailable && info.hash) {
		const appDataFolder = await Updater.appDataFolder();
		const ready = await waitForTarFile(appDataFolder, info.hash);
		if (ready) {
			info.updateReady = true;
			info.error = "";
		}
	}

	return toUpdateInfo(info);
}

export async function checkForUpdatesForApp(): Promise<UpdateInfo> {
	const info = await Updater.checkForUpdate();
	if (!info) return { updateAvailable: false, updateReady: false };
	return toUpdateInfo(info);
}

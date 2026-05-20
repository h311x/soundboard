import { Updater } from "electrobun/bun";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { UpdateInfo } from "../shared/types";

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

/**
 * Electrobun's downloadUpdate() can finish writing the tar but leave updateReady false
 * because it re-checks with Bun.file().exists(), which caches a stale false (Updater.ts ~727).
 */
export async function downloadUpdateForApp(): Promise<UpdateInfo> {
	await Updater.downloadUpdate();
	const info = Updater.updateInfo();
	if (!info) {
		return { updateAvailable: false, updateReady: false };
	}

	if (!info.updateReady && info.updateAvailable && info.hash) {
		const appDataFolder = await Updater.appDataFolder();
		const tarPath = join(appDataFolder, "self-extraction", `${info.hash}.tar`);
		if (existsSync(tarPath)) {
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

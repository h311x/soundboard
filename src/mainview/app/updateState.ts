import type { UpdateInfo } from "@shared/types";

export function updateInfoEqual(a: UpdateInfo | null, b: UpdateInfo | null): boolean {
	if (a === b) return true;
	if (!a || !b) return false;
	return (
		a.updateAvailable === b.updateAvailable &&
		a.updateReady === b.updateReady &&
		a.version === b.version &&
		a.error === b.error
	);
}

export function shouldShowUpdate(
	info: UpdateInfo,
	dismissedVersion: string | null,
): boolean {
	if (!info.updateAvailable) return false;
	if (info.version && dismissedVersion === info.version) return false;
	return true;
}

export function updateBannerKey(info: UpdateInfo | null | undefined): string | null {
	if (!info?.updateAvailable) return null;
	return info.version ?? "update";
}

export function pickUpdateInfo(state: UpdateInfo): UpdateInfo {
	return {
		updateAvailable: state.updateAvailable,
		updateReady: state.updateReady,
		version: state.version,
		error: state.error,
	};
}

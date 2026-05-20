export type UpdateBannerPhase = "ready" | "downloading" | "available";

export type UpdateBannerCopy = {
	phase: UpdateBannerPhase;
	title: string;
	description: string;
};

export function getUpdateBannerCopy(
	ready: boolean,
	downloading: boolean,
	versionLabel: string,
	statusMessage?: string,
): UpdateBannerCopy {
	if (ready) {
		return {
			phase: "ready",
			title: "Ready to install",
			description: "Restart Soundboard to finish updating.",
		};
	}
	if (downloading) {
		return {
			phase: "downloading",
			title: "Downloading update",
			description: describeDownloading(versionLabel, statusMessage),
		};
	}
	return {
		phase: "available",
		title: "Update available",
		description: describeAvailable(versionLabel),
	};
}

function describeDownloading(
	versionLabel: string,
	statusMessage?: string,
): string {
	if (statusMessage) return statusMessage;
	if (versionLabel) return `Version ${versionLabel} is on its way.`;
	return "Hang tight — this usually takes a moment.";
}

function describeAvailable(versionLabel: string): string {
	if (versionLabel) {
		return `Version ${versionLabel} is ready for your soundboard.`;
	}
	return "A newer version is available.";
}

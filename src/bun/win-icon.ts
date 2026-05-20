import type { BrowserWindow } from "electrobun/bun";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/** Resolve app.ico copied into the bundle by Electrobun (build.win.icon). */
export function resolveBundledAppIcon(): string | null {
	const execDir = dirname(process.execPath);
	const candidates = [
		join(execDir, "../Resources/app.ico"),
		join(execDir, "../../Resources/app.ico"),
		join(execDir, "../app.ico"),
		join(execDir, "app.ico"),
		join(execDir, "../../../Resources/app.ico"),
	];
	for (const path of candidates) {
		if (existsSync(path)) return path;
	}
	return null;
}

/**
 * Windows taskbar / title bar use the window icon (WM_SETICON), not only the .exe resource.
 * Electrobun embeds icon.ico at build time but does not expose a public setWindowIcon API.
 */
export async function applyBundledWindowIcon(
	win: BrowserWindow,
): Promise<void> {
	if (process.platform !== "win32") return;

	const iconPath = resolveBundledAppIcon();
	if (!iconPath) {
		console.warn("Soundboard: app.ico not found near", process.execPath);
		return;
	}

	try {
		const { native, hasFFI, toCString } = await import(
			"electrobun/bun/proc/native"
		);
		if (!hasFFI || !native?.symbols?.setWindowIcon) {
			console.warn("Soundboard: setWindowIcon not available in this build");
			return;
		}

		native.symbols.setWindowIcon(win.ptr, toCString(iconPath));
	} catch (e) {
		console.warn("Soundboard: failed to set window icon:", e);
	}
}

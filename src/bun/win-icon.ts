import type { BrowserWindow } from "electrobun/bun";
import { dlopen, FFIType, ptr } from "bun:ffi";
import { copyFile, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const ICON_RETRIES_MS = [0, 200, 600, 1500, 3000];

/** Resolve app.ico copied into the bundle by Electrobun (build.win.icon). */
export function resolveBundledAppIcon(): string | null {
	const execDir = dirname(process.execPath);
	const candidates = [
		join(execDir, "../Resources/app.ico"),
		join(execDir, "../../Resources/app.ico"),
		join(execDir, "../../../Resources/app.ico"),
		join(execDir, "../app.ico"),
		join(execDir, "app.ico"),
	];
	for (const path of candidates) {
		if (existsSync(path)) return path;
	}
	return null;
}

/** Copy icon beside bun.exe so Win32 LoadImageW can use a simple path. */
function mirrorIconBesideExecutable(source: string): string {
	const dest = join(dirname(process.execPath), "app.ico");
	try {
		if (source !== dest) copyFile(source, dest);
		return dest;
	} catch {
		return source;
	}
}

async function applyViaElectrobun(
	win: BrowserWindow,
	iconPath: string,
): Promise<boolean> {
	try {
		const { native, hasFFI, toCString } = await import(
			"electrobun/bun/proc/native"
		);
		if (!hasFFI || !native?.symbols?.setWindowIcon) return false;
		native.symbols.setWindowIcon(win.ptr, toCString(iconPath));
		return true;
	} catch {
		return false;
	}
}

/** Fallback when Electrobun setWindowIcon is unavailable on Windows. */
function applyViaWin32(hwnd: number, iconPath: string): boolean {
	if (process.platform !== "win32" || !hwnd) return false;

	try {
		const user32 = dlopen("user32.dll", {
			LoadImageW: {
				args: [
					FFIType.usize,
					FFIType.pointer,
					FFIType.u32,
					FFIType.i32,
					FFIType.i32,
					FFIType.u32,
				],
				returns: FFIType.usize,
			},
			SendMessageW: {
				args: [
					FFIType.usize,
					FFIType.u32,
					FFIType.usize,
					FFIType.isize,
				],
				returns: FFIType.isize,
			},
		});

		const pathBuf = Buffer.from(`${iconPath.replace(/\//g, "\\")}\0`, "utf16le");
		const IMAGE_ICON = 1;
		const LR_LOADFROMFILE = 0x10;
		const LR_DEFAULTSIZE = 0x40;
		const WM_SETICON = 0x0080;
		const ICON_SMALL = 0;
		const ICON_BIG = 1;

		const hIcon = user32.symbols.LoadImageW(
			0,
			ptr(pathBuf),
			IMAGE_ICON,
			0,
			0,
			LR_LOADFROMFILE | LR_DEFAULTSIZE,
		);
		if (!hIcon) return false;

		user32.symbols.SendMessageW(hwnd, WM_SETICON, ICON_BIG, hIcon);
		user32.symbols.SendMessageW(hwnd, WM_SETICON, ICON_SMALL, hIcon);
		return true;
	} catch (e) {
		console.warn("Soundboard: Win32 icon fallback failed:", e);
		return false;
	}
}

async function applyOnce(win: BrowserWindow): Promise<void> {
	const resolved = resolveBundledAppIcon();
	if (!resolved) {
		console.warn("Soundboard: app.ico not found near", process.execPath);
		return;
	}

	const iconPath = mirrorIconBesideExecutable(resolved);
	const hwnd = Number(win.ptr);
	const ok =
		(await applyViaElectrobun(win, iconPath)) || applyViaWin32(hwnd, iconPath);
	if (!ok) {
		console.warn("Soundboard: could not apply window icon from", iconPath);
	}
}

/**
 * Windows taskbar / title bar use WM_SETICON, not only the .exe resource.
 */
export async function applyBundledWindowIcon(
	win: BrowserWindow,
): Promise<void> {
	if (process.platform !== "win32") return;
	await applyOnce(win);
}

export function scheduleBundledWindowIcon(win: BrowserWindow): void {
	if (process.platform !== "win32") return;
	for (const ms of ICON_RETRIES_MS) {
		setTimeout(() => void applyOnce(win), ms);
	}
}

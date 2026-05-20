/**
 * Windows host-process audio via winmm MCI.
 * Web Audio in WebView2 is attributed to "Windows Feature Experience Pack" / WebView2
 * in volume mixer and audio-routing apps; MCI from bun.exe shows as Soundboard.
 */
import { dlopen, FFIType } from "bun:ffi";
import { extname } from "node:path";

const MCI_TYPES: Record<string, string> = {
	".wav": "waveaudio",
	".mp3": "mpegvideo",
	".mpeg": "mpegvideo",
	".mpg": "mpegvideo",
};

type ActiveAlias = {
	clipId: string;
	alias: string;
};

let winmm: ReturnType<typeof dlopen> | null = null;
const active: ActiveAlias[] = [];
let aliasCounter = 0;

function ensureWinmm() {
	if (winmm) return winmm;
	winmm = dlopen("winmm.dll", {
		mciSendStringA: {
			args: [FFIType.cstring, FFIType.cstring, FFIType.u32, FFIType.u32],
			returns: FFIType.u32,
		},
	});
	return winmm;
}

function mci(cmd: string): void {
	const lib = ensureWinmm();
	const buf = Buffer.alloc(256);
	const code = lib.symbols.mciSendStringA(cmd, buf, 255, 0);
	if (code !== 0) {
		throw new Error(`MCI failed (${code}): ${cmd}`);
	}
}

function escapeMciPath(filePath: string): string {
	return filePath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function isMciSupported(filePath: string): boolean {
	return extname(filePath).toLowerCase() in MCI_TYPES;
}

export function playFile(
	clipId: string,
	filePath: string,
	volume: number,
): { alias: string; durationMs: number } {
	const ext = extname(filePath).toLowerCase();
	const mciType = MCI_TYPES[ext];
	if (!mciType) {
		throw new Error(`Unsupported format for Windows host audio: ${ext || "(none)"}`);
	}

	const alias = `sb${++aliasCounter}`;
	const path = escapeMciPath(filePath);
	const vol = Math.max(0, Math.min(1000, Math.round(volume * 1000)));

	mci(`open "${path}" type ${mciType} alias ${alias}`);
	mci(`setaudio ${alias} volume to ${vol}`);
	mci(`play ${alias}`);

	let durationMs = 3000;
	try {
		const statusBuf = Buffer.alloc(128);
		const lib = ensureWinmm();
		lib.symbols.mciSendStringA(`status ${alias} length`, statusBuf, 127, 0);
		const parsed = Number.parseInt(statusBuf.toString("utf8").trim(), 10);
		if (Number.isFinite(parsed) && parsed > 0) durationMs = parsed;
	} catch {
		/* use default duration for progress UI */
	}

	active.push({ clipId, alias });
	return { alias, durationMs };
}

export function stopClip(clipId: string): void {
	for (const entry of [...active]) {
		if (entry.clipId !== clipId) continue;
		try {
			mci(`stop ${entry.alias}`);
			mci(`close ${entry.alias}`);
		} catch {
			/* already closed */
		}
		const idx = active.indexOf(entry);
		if (idx >= 0) active.splice(idx, 1);
	}
}

export function stopAll(): void {
	for (const entry of [...active]) {
		try {
			mci(`stop ${entry.alias}`);
			mci(`close ${entry.alias}`);
		} catch {
			/* ignore */
		}
	}
	active.length = 0;
}

export function getActivePlays(): { clipId: string; alias: string }[] {
	return active.map((a) => ({ clipId: a.clipId, alias: a.alias }));
}

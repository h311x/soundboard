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

type MciSendStringA = (
	cmd: Buffer,
	out: Buffer,
	outLen: number,
	hwnd: number,
) => number;

let winmm: ReturnType<typeof dlopen> | null = null;
const active: ActiveAlias[] = [];
const retainedBuffers = new Set<Buffer>();
let aliasCounter = 0;

function retain(buf: Buffer): Buffer {
	retainedBuffers.add(buf);
	if (retainedBuffers.size > 128) {
		const drop = retainedBuffers.values().next().value;
		if (drop) retainedBuffers.delete(drop);
	}
	return buf;
}

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

/** Bun FFI requires null-terminated buffers for cstring args, not JS strings. */
function mciCommandBuffer(cmd: string): Buffer {
	return retain(Buffer.from(`${cmd}\0`, "utf8"));
}

function mci(cmd: string): void {
	const lib = ensureWinmm();
	const cmdBuf = mciCommandBuffer(cmd);
	const outBuf = retain(Buffer.alloc(256));
	const code = (lib.symbols.mciSendStringA as unknown as MciSendStringA)(
		cmdBuf,
		outBuf,
		255,
		0,
	);
	if (code !== 0) {
		throw new Error(`MCI failed (${String(code)}): ${cmd}`);
	}
}

function mciPathForOpen(filePath: string): string {
	return filePath.replace(/\\/g, "/");
}

export function isMciSupported(filePath: string): boolean {
	return extname(filePath).toLowerCase() in MCI_TYPES;
}

export function playFile(
	clipId: string,
	filePath: string,
	volume: number,
): { alias: string; durationMs: number } {
	const mciType = resolveMciType(filePath);
	const alias = `sb${++aliasCounter}`;
	const path = mciPathForOpen(filePath);
	const vol = clampMciVolume(volume);

	mci(`open "${path}" type ${mciType} alias ${alias}`);
	mci(`setaudio ${alias} volume to ${vol}`);
	mci(`play ${alias}`);

	const durationMs = readAliasDurationMs(alias);
	active.push({ clipId, alias });
	return { alias, durationMs };
}

function resolveMciType(filePath: string): string {
	const ext = extname(filePath).toLowerCase();
	const mciType = MCI_TYPES[ext];
	if (!mciType) {
		throw new Error(`Unsupported format for Windows host audio: ${ext || "(none)"}`);
	}
	return mciType;
}

function clampMciVolume(volume: number): number {
	return Math.max(0, Math.min(1000, Math.round(volume * 1000)));
}

function readAliasDurationMs(alias: string): number {
	try {
		return parseAliasDurationMs(alias);
	} catch {
		return 3000;
	}
}

function parseAliasDurationMs(alias: string): number {
	const statusCmd = mciCommandBuffer(`status ${alias} length`);
	const statusOut = retain(Buffer.alloc(128));
	const lib = ensureWinmm();
	const code = (lib.symbols.mciSendStringA as unknown as MciSendStringA)(
		statusCmd,
		statusOut,
		127,
		0,
	);
	if (code !== 0) return 3000;
	return parsePositiveInt(statusOut.toString("utf8").trim()) ?? 3000;
}

function parsePositiveInt(raw: string): number | null {
	const parsed = Number.parseInt(raw, 10);
	if (!Number.isFinite(parsed) || parsed <= 0) return null;
	return parsed;
}

export function setAliasVolume(alias: string, volume: number): void {
	const vol = Math.max(0, Math.min(1000, Math.round(volume * 1000)));
	mci(`setaudio ${alias} volume to ${vol}`);
}

export function stopClip(clipId: string): void {
	for (const entry of [...active]) {
		if (entry.clipId !== clipId) continue;
		closeAliasEntry(entry);
	}
}

function closeAliasEntry(entry: ActiveAlias): void {
	try {
		mci(`stop ${entry.alias}`);
		mci(`close ${entry.alias}`);
	} catch {
		/* already closed */
	}
	const idx = active.indexOf(entry);
	if (idx >= 0) active.splice(idx, 1);
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

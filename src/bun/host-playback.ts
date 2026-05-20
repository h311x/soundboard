import type { BrowserWindow } from "electrobun/bun";
import { extname } from "node:path";
import type { PlaybackSnapshot } from "../shared/types";
import { loadAppState, soundFilePath } from "./config";
import { sendToWebview } from "./webview-messages";

async function winAudio() {
	return import("./win-audio");
}

type TrackedPlay = {
	clipId: string;
	alias: string;
	endsAt: number;
	durationMs: number;
};

const plays: TrackedPlay[] = [];
let tickTimer: ReturnType<typeof setInterval> | null = null;

function buildSnapshot(now = Date.now()): PlaybackSnapshot {
	const progress: Record<string, number> = {};
	const playing: Record<string, boolean> = {};

	for (const play of plays) {
		playing[play.clipId] = true;
		const elapsed = now - (play.endsAt - play.durationMs);
		const raw = play.durationMs > 0 ? elapsed / play.durationMs : 0;
		progress[play.clipId] = Math.max(
			progress[play.clipId] ?? 0,
			Math.min(1, Math.max(0, raw)),
		);
		if (now >= play.endsAt) {
			progress[play.clipId] = 1;
			playing[play.clipId] = false;
		}
	}

	return { progress, playing };
}

function pruneFinished(now = Date.now()) {
	for (let i = plays.length - 1; i >= 0; i--) {
		if (plays[i] && now >= plays[i].endsAt) {
			plays.splice(i, 1);
		}
	}
}

function emitSnapshot(win: BrowserWindow) {
	const now = Date.now();
	pruneFinished(now);
	sendToWebview(win, "playbackSnapshot", buildSnapshot(now));
}

function ensureTick(win: BrowserWindow) {
	if (tickTimer) return;
	tickTimer = setInterval(() => {
		emitSnapshot(win);
		const now = Date.now();
		pruneFinished(now);
		if (plays.length === 0 && tickTimer) {
			clearInterval(tickTimer);
			tickTimer = null;
			emitSnapshot(win);
		}
	}, 50);
}

export async function playClipOnHost(
	win: BrowserWindow,
	clipId: string,
): Promise<{ ok: boolean; error?: string }> {
	if (process.platform !== "win32") {
		return { ok: false, error: "Host audio is only used on Windows" };
	}

	const state = await loadAppState();
	const clip = state.board.clips.find((c) => c.id === clipId);
	if (!clip) return { ok: false, error: "Clip not found" };
	if (clip.missing) return { ok: false, error: "Sound file is missing" };

	const path = soundFilePath(clip.fileName);
	const audio = await winAudio();
	if (!audio.isMciSupported(path)) {
		const ext = extname(clip.fileName).toLowerCase() || "(none)";
		return {
			ok: false,
			error: `${ext} is not supported for Windows routing yet — use MP3 or WAV`,
		};
	}

	try {
		const volume = clip.volume * state.board.masterVolume;
		const { alias, durationMs } = audio.playFile(clipId, path, volume);
		const now = Date.now();
		plays.push({
			clipId,
			alias,
			durationMs,
			endsAt: now + durationMs,
		});
		ensureTick(win);
		emitSnapshot(win);
		return { ok: true };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Playback failed";
		return { ok: false, error: msg };
	}
}

export async function stopAllOnHost(win: BrowserWindow) {
	if (process.platform !== "win32") return;
	const audio = await winAudio();
	audio.stopAll();
	plays.length = 0;
	if (tickTimer) {
		clearInterval(tickTimer);
		tickTimer = null;
	}
	emitSnapshot(win);
}

export async function stopClipOnHost(win: BrowserWindow, clipId: string) {
	if (process.platform !== "win32") return;
	const audio = await winAudio();
	audio.stopClip(clipId);
	for (let i = plays.length - 1; i >= 0; i--) {
		if (plays[i]?.clipId === clipId) plays.splice(i, 1);
	}
	emitSnapshot(win);
}

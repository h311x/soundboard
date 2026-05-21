import type { BrowserWindow } from "electrobun/bun";
import type { PlaybackSnapshot } from "../shared/types";
import { loadAppState } from "./config";
import { validateHostPlay } from "./host-playback-validate";
import {
	pruneFinishedPlays,
	snapshotFromPlays,
} from "./host-playback-snapshot";
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
	return snapshotFromPlays(plays, now);
}

function emitSnapshot(win: BrowserWindow) {
	const now = Date.now();
	pruneFinishedPlays(plays, now);
	sendToWebview(win, "playbackSnapshot", buildSnapshot(now));
}

function ensureTick(win: BrowserWindow) {
	if (tickTimer) return;
	tickTimer = setInterval(() => {
		emitSnapshot(win);
		const now = Date.now();
		pruneFinishedPlays(plays, now);
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
	return playValidatedClipOnHost(win, clipId);
}

async function playValidatedClipOnHost(
	win: BrowserWindow,
	clipId: string,
): Promise<{ ok: boolean; error?: string }> {
	const state = await loadAppState();
	const audio = await winAudio();
	const validated = validateHostPlay(
		state.board.clips,
		clipId,
		audio.isMciSupported,
	);
	if (!validated.ok) return validated;

	return startHostPlay(win, clipId, validated.path, validated.clip.volume, state.board.masterVolume);
}

async function startHostPlay(
	win: BrowserWindow,
	clipId: string,
	path: string,
	clipVolume: number,
	masterVolume: number,
): Promise<{ ok: boolean; error?: string }> {
	try {
		const audio = await winAudio();
		const volume = clipVolume * masterVolume;
		const { alias, durationMs } = audio.playFile(clipId, path, volume);
		trackPlay(clipId, alias, durationMs);
		ensureTick(win);
		emitSnapshot(win);
		return { ok: true };
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Playback failed";
		return { ok: false, error: msg };
	}
}

function trackPlay(clipId: string, alias: string, durationMs: number): void {
	const now = Date.now();
	plays.push({ clipId, alias, durationMs, endsAt: now + durationMs });
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

/** `effectiveVolume` is clip × master (0–1), already scaled in the webview. */
export async function previewClipVolumeOnHost(
	clipId: string,
	effectiveVolume: number,
): Promise<void> {
	if (process.platform !== "win32") return;
	const audio = await winAudio();
	applyVolumeToClipPlays(plays, clipId, effectiveVolume, audio.setAliasVolume);
}

export async function previewMasterVolumeOnHost(
	masterVolume: number,
): Promise<void> {
	if (process.platform !== "win32") return;
	const state = await loadAppState();
	const audio = await winAudio();
	for (const play of plays) {
		setMasterPreviewVolume(play, state, masterVolume, audio.setAliasVolume);
	}
}

function setMasterPreviewVolume(
	play: TrackedPlay,
	state: Awaited<ReturnType<typeof loadAppState>>,
	masterVolume: number,
	setVolume: (alias: string, volume: number) => void,
): void {
	const clip = state.board.clips.find((c) => c.id === play.clipId);
	if (!clip) return;
	setVolume(play.alias, clip.volume * masterVolume);
}

export async function stopClipOnHost(win: BrowserWindow, clipId: string) {
	if (process.platform !== "win32") return;
	const audio = await winAudio();
	audio.stopClip(clipId);
	removePlaysForClip(clipId);
	emitSnapshot(win);
}

function applyVolumeToClipPlays(
	playsList: TrackedPlay[],
	clipId: string,
	volume: number,
	setVolume: (alias: string, volume: number) => void,
): void {
	for (const play of playsList) {
		if (play.clipId !== clipId) continue;
		setVolume(play.alias, volume);
	}
}

function removePlaysForClip(clipId: string): void {
	for (let i = plays.length - 1; i >= 0; i--) {
		removePlayIndexIfClip(i, clipId);
	}
}

function removePlayIndexIfClip(index: number, clipId: string): void {
	if (plays[index]?.clipId === clipId) plays.splice(index, 1);
}

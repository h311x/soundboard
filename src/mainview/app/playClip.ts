import type { AppState, Clip } from "@shared/types";
import { audioEngine } from "../audio/engine";
import { getRpc } from "../rpc";

export type PlayClipDeps = {
	getState: () => AppState | null;
	showToast: (message: string, variant?: "info" | "error") => void;
	setAudioBlocked: (blocked: boolean) => void;
};

export async function playClip(clip: Clip, deps: PlayClipDeps): Promise<void> {
	if (clip.missing) {
		deps.showToast("Sound file is missing", "error");
		return;
	}
	await playClipSound(clip, deps);
}

async function playClipSound(clip: Clip, deps: PlayClipDeps): Promise<void> {
	try {
		if (await playViaHost(clip, deps.getState, deps.showToast)) return;
		await playViaWebAudio(clip, deps.showToast, deps.setAudioBlocked);
	} catch (e) {
		console.error(e);
		deps.showToast(playErrorMessage(e), "error");
	}
}

function playErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) return error.message;
	return "Failed to play sound";
}

async function playViaHost(
	clip: Clip,
	getAppState: () => AppState | null,
	showToast: PlayClipDeps["showToast"],
): Promise<boolean> {
	const appState = getAppState();
	if (!hostAudioEnabled(appState)) return false;
	return playViaHostRpc(clip.id, showToast);
}

function hostAudioEnabled(appState: AppState | null): boolean {
	return Boolean(appState?.capabilities.hostAudio);
}

async function playViaHostRpc(
	clipId: string,
	showToast: PlayClipDeps["showToast"],
): Promise<boolean> {
	const result = await getRpc().request.playClipAudio({ id: clipId });
	if (result.ok) return true;
	showToast(result.error ?? "Failed to play sound", "error");
	return true;
}

async function playViaWebAudio(
	clip: Clip,
	showToast: PlayClipDeps["showToast"],
	setAudioBlocked: (blocked: boolean) => void,
): Promise<void> {
	await ensureClipLoaded(clip);
	const ok = await audioEngine.play(clip.id, clip.volume);
	if (ok) {
		setAudioBlocked(false);
		return;
	}
	setAudioBlocked(true);
	showToast("Click anywhere in the app once to enable sound", "info");
}

async function ensureClipLoaded(clip: Clip): Promise<void> {
	if (audioEngine.hasBuffer(clip.id)) return;
	await audioEngine.loadClip(clip.id, clip.fileName);
}

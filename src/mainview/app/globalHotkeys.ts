import type { AppState, Clip } from "@shared/types";
import { eventToAccelerator } from "../utils/hotkey";

export function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return isFormField(target);
}

function isFormField(target: HTMLElement): boolean {
	if (target instanceof HTMLInputElement) return true;
	if (target instanceof HTMLTextAreaElement) return true;
	return target.isContentEditable;
}

export function findClipForAccelerator(
	state: AppState | null,
	accel: string,
): Clip | undefined {
	return state?.board.clips.find((c) => c.hotkey === accel);
}

export function createGlobalHotkeyListener(
	getState: () => AppState | null,
	isModalOpen: () => boolean,
	play: (clip: Clip) => void,
): (e: KeyboardEvent) => void {
	return (e) => handleGlobalHotkeyKeydown(e, getState, isModalOpen, play);
}

function handleGlobalHotkeyKeydown(
	e: KeyboardEvent,
	getState: () => AppState | null,
	isModalOpen: () => boolean,
	play: (clip: Clip) => void,
): void {
	const clip = resolveHotkeyClip(e, getState, isModalOpen);
	if (!clip) return;
	e.preventDefault();
	e.stopPropagation();
	play(clip);
}

function resolveHotkeyClip(
	e: KeyboardEvent,
	getState: () => AppState | null,
	isModalOpen: () => boolean,
): Clip | undefined {
	if (shouldIgnoreHotkey(e, isModalOpen)) return undefined;
	return clipForAccelerator(getState(), eventToAccelerator(e));
}

function shouldIgnoreHotkey(
	e: KeyboardEvent,
	isModalOpen: () => boolean,
): boolean {
	if (isModalOpen()) return true;
	return isEditableTarget(e.target);
}

function clipForAccelerator(
	state: AppState | null,
	accel: string | null,
): Clip | undefined {
	if (!accel) return undefined;
	return playableClip(findClipForAccelerator(state, accel));
}

function playableClip(clip: Clip | undefined): Clip | undefined {
	if (!clip) return undefined;
	if (clip.missing) return undefined;
	return clip;
}

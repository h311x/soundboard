import { GlobalShortcut } from "electrobun/bun";
import type { BrowserWindow } from "electrobun/bun";
import type { Clip } from "../shared/types";
import { playClipOnHost } from "./host-playback";
import { sendToWebview } from "./webview-messages";

export function registerClipHotkey(
	win: BrowserWindow,
	clip: Clip,
	registered: Map<string, string>,
): void {
	if (!canRegisterClipHotkey(clip, registered)) return;

	const hotkey = clip.hotkey;
	const clipId = clip.id;
	const ok = GlobalShortcut.register(hotkey, () => {
		onHotkeyPressed(win, clipId);
	});
	if (ok) registered.set(hotkey, clipId);
}

function canRegisterClipHotkey(
	clip: Clip,
	registered: Map<string, string>,
): boolean {
	if (!clip.hotkey) return false;
	if (clip.missing) return false;
	return !registered.has(clip.hotkey);
}

function onHotkeyPressed(win: BrowserWindow, clipId: string): void {
	if (process.platform === "win32") {
		void playClipOnHost(win, clipId).then(reportHostPlayError(win));
		return;
	}
	sendToWebview(win, "hotkeyPlay", { id: clipId });
}

function reportHostPlayError(win: BrowserWindow) {
	return (result: { ok: boolean; error?: string }) => {
		if (result.ok || !result.error) return;
		sendToWebview(win, "showToast", {
			message: result.error,
			variant: "error",
		});
	};
}

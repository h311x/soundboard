import { GlobalShortcut } from "electrobun/bun";
import type { BrowserWindow } from "electrobun/bun";
import type { BoardData } from "../shared/types";
import { loadBoard } from "./config";
import { playClipOnHost } from "./host-playback";
import { sendToWebview } from "./webview-messages";

let registered = new Map<string, string>();

export function unregisterAllHotkeys(): void {
	GlobalShortcut.unregisterAll();
	registered.clear();
}

export async function syncHotkeys(
	win: BrowserWindow,
	board?: BoardData,
): Promise<void> {
	const data = board ?? (await loadBoard());
	unregisterAllHotkeys();

	for (const clip of data.clips) {
		if (!clip.hotkey || clip.missing) continue;
		if (registered.has(clip.hotkey)) continue;

		const hotkey = clip.hotkey;
		const clipId = clip.id;
		const ok = GlobalShortcut.register(hotkey, () => {
			if (process.platform === "win32") {
				void playClipOnHost(win, clipId).then((result) => {
					if (!result.ok && result.error) {
						sendToWebview(win, "showToast", {
							message: result.error,
							variant: "error",
						});
					}
				});
				return;
			}
			sendToWebview(win, "hotkeyPlay", { id: clipId });
		});
		if (ok) registered.set(hotkey, clipId);
	}
}

export function validateHotkey(
	board: BoardData,
	clipId: string,
	hotkey: string,
): string | null {
	if (!hotkey) return null;
	for (const clip of board.clips) {
		if (clip.id !== clipId && clip.hotkey === hotkey) {
			return "Hotkey already used by another clip";
		}
	}
	if (registered.has(hotkey) && registered.get(hotkey) !== clipId) {
		return "Hotkey already registered";
	}
	return null;
}

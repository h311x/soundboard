import type { AppState } from "@shared/types";
import { getRpc } from "../rpc";

export async function saveClipHotkey(
	clipId: string,
	hotkey: string,
	applyState: (s: AppState) => Promise<void>,
	showToast: (message: string, variant?: "info" | "error") => void,
): Promise<boolean> {
	const result = await getRpc().request.setClipHotkey({ id: clipId, hotkey });
	if (!result.ok) {
		showToast(result.error ?? "Hotkey conflict", "error");
		return false;
	}
	await applyState(result.state);
	showToast(hotkeySavedMessage(hotkey));
	return true;
}

function hotkeySavedMessage(hotkey: string): string {
	if (hotkey) return "Shortcut saved";
	return "Shortcut removed";
}

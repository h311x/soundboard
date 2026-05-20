import { codeToKeyPart } from "./hotkey-codes";
import { isModifierKey, modifierPartsFromEvent } from "./hotkey-modifiers";

/** Build Electrobun accelerator from a keydown with a non-modifier key. */
export function eventToAccelerator(e: KeyboardEvent): string | null {
	if (e.key === "Escape") return null;
	if (isModifierKey(e)) return null;

	const keyPart = codeToKeyPart(e.code);
	if (!keyPart) return null;

	return [...modifierPartsFromEvent(e), keyPart].join("+");
}

const isMac =
	typeof navigator !== "undefined" &&
	/Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

const SYMBOLS: Record<string, string> = {
	CommandOrControl: isMac ? "⌘" : "Ctrl",
	Command: "⌘",
	Control: "Ctrl",
	Alt: isMac ? "⌥" : "Alt",
	Shift: isMac ? "⇧" : "Shift",
	Space: "Space",
};

export function getAcceleratorParts(accelerator: string): string[] {
	if (!accelerator) return [];
	return accelerator.split("+");
}

export function formatHotkeyPart(part: string): string {
	return SYMBOLS[part] ?? part;
}

/** Human-readable label for pad UI (compact single line) */
export function formatHotkeyDisplay(accelerator: string): string {
	if (!accelerator) return "";
	const sep = isMac ? "" : "+";
	return getAcceleratorParts(accelerator).map(formatHotkeyPart).join(sep);
}


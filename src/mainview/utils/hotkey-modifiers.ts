const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"]);

const MODIFIER_CODES = new Set([
	"ShiftLeft",
	"ShiftRight",
	"ControlLeft",
	"ControlRight",
	"AltLeft",
	"AltRight",
	"MetaLeft",
	"MetaRight",
]);

export function isModifierKey(e: KeyboardEvent): boolean {
	return MODIFIER_KEYS.has(e.key) || MODIFIER_CODES.has(e.code);
}

export function modifierPartsFromEvent(e: KeyboardEvent): string[] {
	const parts: string[] = [];
	if (e.metaKey || e.ctrlKey) parts.push("CommandOrControl");
	if (e.altKey) parts.push("Alt");
	if (e.shiftKey) parts.push("Shift");
	return parts;
}

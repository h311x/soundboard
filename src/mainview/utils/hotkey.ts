const CODE_TO_KEY: Record<string, string> = {
	Space: "Space",
	Enter: "Enter",
	Tab: "Tab",
	Escape: "Escape",
	Backspace: "Backspace",
	Delete: "Delete",
	ArrowUp: "Up",
	ArrowDown: "Down",
	ArrowLeft: "Left",
	ArrowRight: "Right",
	Home: "Home",
	End: "End",
	PageUp: "PageUp",
	PageDown: "PageDown",
	Minus: "-",
	Equal: "=",
	BracketLeft: "[",
	BracketRight: "]",
	Semicolon: ";",
	Quote: "'",
	Comma: ",",
	Period: ".",
	Slash: "/",
	Backslash: "\\",
	Backquote: "`",
};

function isModifierKey(e: KeyboardEvent): boolean {
	return (
		e.key === "Shift" ||
		e.key === "Control" ||
		e.key === "Alt" ||
		e.key === "Meta" ||
		e.code === "ShiftLeft" ||
		e.code === "ShiftRight" ||
		e.code === "ControlLeft" ||
		e.code === "ControlRight" ||
		e.code === "AltLeft" ||
		e.code === "AltRight" ||
		e.code === "MetaLeft" ||
		e.code === "MetaRight"
	);
}

function codeToKeyPart(code: string): string | null {
	if (code.startsWith("Key")) return code.slice(3).toUpperCase();
	if (code.startsWith("Digit")) return code.slice(5);
	if (code.startsWith("Numpad")) {
		const rest = code.slice(6);
		if (/^\d$/.test(rest)) return rest;
		if (rest === "Add") return "Plus";
		if (rest === "Subtract") return "Minus";
		if (rest === "Multiply") return "*";
		if (rest === "Divide") return "/";
		if (rest === "Decimal") return ".";
	}
	if (/^F\d+$/.test(code)) return code;
	return CODE_TO_KEY[code] ?? null;
}

/** Build Electrobun accelerator from a keydown with a non-modifier key. */
export function eventToAccelerator(e: KeyboardEvent): string | null {
	if (e.key === "Escape") return null;
	if (isModifierKey(e)) return null;

	const keyPart = codeToKeyPart(e.code);
	if (!keyPart) return null;

	const parts: string[] = [];
	if (e.metaKey || e.ctrlKey) parts.push("CommandOrControl");
	if (e.altKey) parts.push("Alt");
	if (e.shiftKey) parts.push("Shift");
	parts.push(keyPart);

	return parts.join("+");
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

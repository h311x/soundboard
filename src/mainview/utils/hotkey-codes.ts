export const CODE_TO_KEY: Record<string, string> = {
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

const NUMPAD_SYMBOLS: Record<string, string> = {
	Add: "Plus",
	Subtract: "Minus",
	Multiply: "*",
	Divide: "/",
	Decimal: ".",
};

export function keyPartFromKeyCode(code: string): string | null {
	if (!code.startsWith("Key")) return null;
	return code.slice(3).toUpperCase();
}

export function keyPartFromDigitCode(code: string): string | null {
	if (!code.startsWith("Digit")) return null;
	return code.slice(5);
}

export function keyPartFromNumpadCode(code: string): string | null {
	if (!code.startsWith("Numpad")) return null;
	const rest = code.slice(6);
	if (/^\d$/.test(rest)) return rest;
	return NUMPAD_SYMBOLS[rest] ?? null;
}

export function keyPartFromFunctionCode(code: string): string | null {
	return /^F\d+$/.test(code) ? code : null;
}

export function keyPartFromNamedCode(code: string): string | null {
	return CODE_TO_KEY[code] ?? null;
}

export function codeToKeyPart(code: string): string | null {
	return (
		keyPartFromKeyCode(code) ??
		keyPartFromDigitCode(code) ??
		keyPartFromNumpadCode(code) ??
		keyPartFromFunctionCode(code) ??
		keyPartFromNamedCode(code)
	);
}

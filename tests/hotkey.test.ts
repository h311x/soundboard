import { describe, expect, test } from "bun:test";
import { codeToKeyPart } from "../src/mainview/utils/hotkey-codes";
import {
	eventToAccelerator,
	formatHotkeyDisplay,
} from "../src/mainview/utils/hotkey";
import { isModifierKey } from "../src/mainview/utils/hotkey-modifiers";

describe("isModifierKey", () => {
	test("detects modifier keys", () => {
		expect(
			isModifierKey({ key: "Shift", code: "ShiftLeft" } as KeyboardEvent),
		).toBe(true);
		expect(isModifierKey({ key: "a", code: "KeyA" } as KeyboardEvent)).toBe(
			false,
		);
	});
});

describe("codeToKeyPart", () => {
	test("maps letter and digit codes", () => {
		expect(codeToKeyPart("KeyA")).toBe("A");
		expect(codeToKeyPart("Digit5")).toBe("5");
		expect(codeToKeyPart("Space")).toBe("Space");
	});
});

describe("eventToAccelerator", () => {
	test("builds accelerator for letter with modifiers", () => {
		const accel = eventToAccelerator({
			key: "a",
			code: "KeyA",
			ctrlKey: true,
			shiftKey: true,
		} as KeyboardEvent);
		expect(accel).toBe("CommandOrControl+Shift+A");
	});

	test("returns null for escape", () => {
		expect(
			eventToAccelerator({ key: "Escape", code: "Escape" } as KeyboardEvent),
		).toBe(null);
	});
});

describe("formatHotkeyDisplay", () => {
	test("formats empty accelerator", () => {
		expect(formatHotkeyDisplay("")).toBe("");
	});
});

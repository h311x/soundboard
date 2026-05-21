import { describe, expect, test } from "bun:test";
import {
	shouldShowUpdate,
	updateInfoEqual,
} from "../src/mainview/app/updateState";

describe("updateInfoEqual", () => {
	test("compares visible update fields", () => {
		const a = { updateAvailable: true, updateReady: false, version: "1.2.0" };
		const b = { updateAvailable: true, updateReady: false, version: "1.2.0" };
		expect(updateInfoEqual(a, b)).toBe(true);
		expect(updateInfoEqual(a, { ...a, updateReady: true })).toBe(false);
	});
});

describe("shouldShowUpdate", () => {
	test("hides dismissed version", () => {
		const info = { updateAvailable: true, updateReady: false, version: "1.2.0" };
		expect(shouldShowUpdate(info, "1.2.0")).toBe(false);
		expect(shouldShowUpdate(info, "1.1.0")).toBe(true);
	});
});

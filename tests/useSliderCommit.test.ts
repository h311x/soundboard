import { describe, expect, test } from "bun:test";
import { sliderDisplay, volumesClose } from "../src/mainview/hooks/useSliderCommit";

describe("sliderDisplay", () => {
	test("uses prop value when not dragging locally", () => {
		expect(sliderDisplay(0.5, null, false)).toBe(0.5);
	});

	test("uses local value while dragging", () => {
		expect(sliderDisplay(0.5, 0.8, true)).toBe(0.8);
	});

	test("uses prop after commit when server caught up", () => {
		expect(sliderDisplay(0.8, 0.8, false)).toBe(0.8);
	});

	test("keeps local until server catches up after commit", () => {
		expect(sliderDisplay(0.5, 0.8, false)).toBe(0.8);
	});
});

describe("volumesClose", () => {
	test("treats near-equal volumes as close", () => {
		expect(volumesClose(0.5, 0.504)).toBe(true);
		expect(volumesClose(0.5, 0.51)).toBe(false);
	});
});

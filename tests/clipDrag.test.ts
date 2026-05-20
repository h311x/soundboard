import { describe, expect, test } from "bun:test";
import type { DragEndEvent } from "@dnd-kit/core";
import {
	clipIdsAfterDrag,
	clipIdsEqual,
	moveClipIds,
	pruneOrderOverride,
	resolveClipIds,
} from "../src/mainview/app/clipOrder";

function dragEnd(active: string, over: string | null): DragEndEvent {
	return { active: { id: active }, over: over ? { id: over } : null } as DragEndEvent;
}

describe("resolveClipIds", () => {
	const server = ["a", "b", "c"];

	test("uses server when no override", () => {
		expect(resolveClipIds(null, server)).toBe(server);
	});

	test("uses override while server order is stale", () => {
		expect(resolveClipIds(["c", "a", "b"], server)).toEqual(["c", "a", "b"]);
	});

	test("uses server when override matches server", () => {
		expect(resolveClipIds(["a", "b", "c"], server)).toBe(server);
	});

	test("uses server when clip sets differ", () => {
		expect(resolveClipIds(["a", "b"], server)).toBe(server);
	});
});

describe("pruneOrderOverride", () => {
	const server = ["a", "b"];

	test("drops null and synced overrides", () => {
		expect(pruneOrderOverride(null, server)).toBeNull();
		expect(pruneOrderOverride(["a", "b"], server)).toBeNull();
	});

	test("keeps pending reorder", () => {
		expect(pruneOrderOverride(["b", "a"], server)).toEqual(["b", "a"]);
	});
});

describe("clipIdsAfterDrag", () => {
	test("matches sortable preset onDragEnd + arrayMove", () => {
		expect(clipIdsAfterDrag(dragEnd("c", "a"), ["a", "b", "c"])).toEqual([
			"c",
			"a",
			"b",
		]);
	});

	test("returns null when dropped outside or on self", () => {
		expect(clipIdsAfterDrag(dragEnd("a", null), ["a", "b"])).toBeNull();
		expect(clipIdsAfterDrag(dragEnd("a", "a"), ["a", "b"])).toBeNull();
	});
});

describe("moveClipIds", () => {
	test("reorders by active and over id", () => {
		expect(moveClipIds(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
	});

	test("returns null when ids are missing or unchanged", () => {
		expect(moveClipIds(["a", "b"], "x", "a")).toBeNull();
		expect(moveClipIds(["a", "b"], "a", "a")).toBeNull();
	});
});

describe("clipIdsEqual", () => {
	test("compares order", () => {
		expect(clipIdsEqual(["a"], ["a"])).toBe(true);
		expect(clipIdsEqual(["a", "b"], ["b", "a"])).toBe(false);
	});
});

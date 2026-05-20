import { extname } from "node:path";
import type { BoardData } from "../shared/types";
import { soundFilePath } from "./config";

export type HostPlayValidation =
	| { ok: true; clip: BoardData["clips"][number]; path: string }
	| { ok: false; error: string };

export function validateHostPlay(
	clips: BoardData["clips"],
	clipId: string,
	isSupported: (path: string) => boolean,
): HostPlayValidation {
	const clip = findClip(clips, clipId);
	if (!clip) return { ok: false, error: "Clip not found" };
	if (clip.missing) return { ok: false, error: "Sound file is missing" };
	return validateClipPath(clip, isSupported);
}

function findClip(
	clips: BoardData["clips"],
	clipId: string,
): BoardData["clips"][number] | undefined {
	return clips.find((c) => c.id === clipId);
}

function validateClipPath(
	clip: BoardData["clips"][number],
	isSupported: (path: string) => boolean,
): HostPlayValidation {
	const path = soundFilePath(clip.fileName);
	if (isSupported(path)) return { ok: true, clip, path };
	return unsupportedFormatError(clip.fileName);
}

function unsupportedFormatError(fileName: string): HostPlayValidation {
	const ext = extname(fileName).toLowerCase() || "(none)";
	return {
		ok: false,
		error: `${ext} is not supported for Windows routing yet — use MP3 or WAV`,
	};
}

import type { PlaybackSnapshot } from "@shared/types";

export type ActivePlaySample = {
	clipId: string;
	ended: boolean;
	startedAt: number;
	duration: number;
};

export function progressForActivePlay(
	play: ActivePlaySample,
	now: number,
): { playing: boolean; progress: number } {
	if (play.ended) {
		return { playing: false, progress: 1 };
	}
	return { playing: true, progress: normalizedProgress(play, now) };
}

function normalizedProgress(play: ActivePlaySample, now: number): number {
	const elapsed = now - play.startedAt;
	const raw = play.duration > 0 ? elapsed / play.duration : 0;
	if (isPlaybackComplete(raw, elapsed, play.duration)) return 1;
	return Math.min(1, Math.max(0, raw));
}

function isPlaybackComplete(
	raw: number,
	elapsed: number,
	duration: number,
): boolean {
	if (raw >= 0.995) return true;
	return elapsed >= duration - 0.02;
}

export function mergePlayIntoSnapshot(
	snapshot: PlaybackSnapshot,
	clipId: string,
	playing: boolean,
	progress: number,
): void {
	if (playing) snapshot.playing[clipId] = true;
	snapshot.progress[clipId] = Math.max(snapshot.progress[clipId] ?? 0, progress);
}

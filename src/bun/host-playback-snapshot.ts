import type { PlaybackSnapshot } from "../shared/types";

export type HostTrackedPlay = {
	clipId: string;
	endsAt: number;
	durationMs: number;
};

export function snapshotFromPlays(
	plays: HostTrackedPlay[],
	now: number,
): PlaybackSnapshot {
	const progress: Record<string, number> = {};
	const playing: Record<string, boolean> = {};

	for (const play of plays) {
		applyPlayToSnapshot(play, now, progress, playing);
	}

	return { progress, playing };
}

function applyPlayToSnapshot(
	play: HostTrackedPlay,
	now: number,
	progress: Record<string, number>,
	playing: Record<string, boolean>,
): void {
	playing[play.clipId] = now < play.endsAt;
	progress[play.clipId] = progressForPlay(play, now);
}

function progressForPlay(play: HostTrackedPlay, now: number): number {
	if (now >= play.endsAt) return 1;
	const elapsed = now - (play.endsAt - play.durationMs);
	const raw = play.durationMs > 0 ? elapsed / play.durationMs : 0;
	return Math.min(1, Math.max(0, raw));
}

export function pruneFinishedPlays(plays: HostTrackedPlay[], now: number): void {
	for (let i = plays.length - 1; i >= 0; i--) {
		prunePlayAt(plays, i, now);
	}
}

function prunePlayAt(plays: HostTrackedPlay[], index: number, now: number): void {
	const play = plays[index];
	if (!play) return;
	if (now >= play.endsAt) plays.splice(index, 1);
}

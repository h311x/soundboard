import type { PlaybackSnapshot } from "@shared/types";

const EMPTY: PlaybackSnapshot = { progress: {}, playing: {} };

let snapshot: PlaybackSnapshot = EMPTY;
const listeners = new Set<() => void>();

export function setHostPlaybackSnapshot(next: PlaybackSnapshot) {
	snapshot = next;
	for (const listener of listeners) {
		listener();
	}
}

export const hostPlaybackStore = {
	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
	getSnapshot(): PlaybackSnapshot {
		return snapshot;
	},
};

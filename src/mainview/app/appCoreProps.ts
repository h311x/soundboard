import type { AppState, PlaybackSnapshot } from "@shared/types";

export type AppCoreProps = {
	state: AppState;
	playback: PlaybackSnapshot;
	getState: () => AppState | null;
	applyState: (s: AppState) => Promise<void>;
	applyStateSync: (s: AppState) => void;
	showToast: (message: string, variant?: "info" | "error") => void;
};

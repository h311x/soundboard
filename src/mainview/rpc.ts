import { Electroview } from "electrobun/view";
import type {
	AppState,
	PlaybackSnapshot,
	SoundboardRPC,
	UpdateDownloadState,
} from "@shared/types";
import { setHostPlaybackSnapshot } from "./audio/hostPlayback";

export type RpcHandlers = {
	onStateChanged: (state: AppState) => void;
	onPlayClip: (id: string) => void;
	onStopAll: () => void;
	onShowToast: (message: string, variant?: "info" | "error") => void;
};

let handlers: RpcHandlers = {
	onStateChanged: () => {},
	onPlayClip: () => {},
	onStopAll: () => {},
	onShowToast: () => {},
};

let onUpdateDownload: ((state: UpdateDownloadState) => void) | null = null;

export function setUpdateDownloadHandler(
	handler: ((state: UpdateDownloadState) => void) | null,
) {
	onUpdateDownload = handler;
}

export function setRpcHandlers(next: RpcHandlers) {
	handlers = next;
}

/** Status polls are fast; download runs in Bun without blocking RPC. */
const RPC_MAX_REQUEST_MS = 60_000;

export const electroview = new Electroview({
	rpc: Electroview.defineRPC<SoundboardRPC>({
		maxRequestTime: RPC_MAX_REQUEST_MS,
		handlers: {
			requests: {},
			messages: {
				playClip: ({ id }) => handlers.onPlayClip(id),
				stopAll: () => handlers.onStopAll(),
				stateChanged: ({ state }) => handlers.onStateChanged(state),
				showToast: ({ message, variant }) =>
					handlers.onShowToast(message, variant),
				hotkeyPlay: ({ id }) => handlers.onPlayClip(id),
				playbackSnapshot: (payload: PlaybackSnapshot) =>
					setHostPlaybackSnapshot(payload),
				updateDownloadProgress: (payload) => onUpdateDownload?.(payload),
			},
		},
	}),
});

export function getRpc() {
	if (!electroview.rpc) {
		throw new Error("RPC transport not ready");
	}
	return electroview.rpc;
}

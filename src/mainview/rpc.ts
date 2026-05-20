import { Electroview } from "electrobun/view";
import type { AppState, PlaybackSnapshot, SoundboardRPC } from "@shared/types";
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

let onRelayout = () => {};

export function setRpcHandlers(next: RpcHandlers) {
	handlers = next;
}

export function setRelayoutHandler(fn: () => void) {
	onRelayout = fn;
}

/** Webview → bun requests; default Electrobun timeout is 1s which breaks update downloads. */
const RPC_MAX_REQUEST_MS = 600_000;

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
				relayout: () => onRelayout(),
				playbackSnapshot: (payload: PlaybackSnapshot) =>
					setHostPlaybackSnapshot(payload),
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

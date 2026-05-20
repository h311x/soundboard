import { Electroview } from "electrobun/view";
import type { AppState, SoundboardRPC } from "@shared/types";

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

export function setRpcHandlers(next: RpcHandlers) {
	handlers = next;
}

export const electroview = new Electroview({
	rpc: Electroview.defineRPC<SoundboardRPC>({
		handlers: {
			requests: {},
			messages: {
				playClip: ({ id }) => handlers.onPlayClip(id),
				stopAll: () => handlers.onStopAll(),
				stateChanged: ({ state }) => handlers.onStateChanged(state),
				showToast: ({ message, variant }) =>
					handlers.onShowToast(message, variant),
				hotkeyPlay: ({ id }) => handlers.onPlayClip(id),
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

import type { BrowserWindow } from "electrobun/bun";
import type { AppState, SoundboardRPC } from "../shared/types";

type WebviewSend = {
	send: {
		[K in keyof SoundboardRPC["webview"]["messages"]]: (
			payload: SoundboardRPC["webview"]["messages"][K],
		) => void;
	};
};

export function sendToWebview<M extends keyof SoundboardRPC["webview"]["messages"]>(
	win: BrowserWindow,
	message: M,
	payload: SoundboardRPC["webview"]["messages"][M],
) {
	const rpc = win.webview.rpc as WebviewSend | undefined;
	const send = rpc?.send[message] as ((p: typeof payload) => void) | undefined;
	send?.(payload);
}

export function notifyState(win: BrowserWindow, state: AppState) {
	sendToWebview(win, "stateChanged", { state });
}

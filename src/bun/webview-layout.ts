import type { BrowserWindow } from "electrobun/bun";

/**
 * Electrobun #431: on Windows with a native title bar, the webview initially reports
 * innerWidth/innerHeight as the full window frame (including chrome). After the first
 * resize event, dimensions match the client area. Nudge setSize so autoResize runs once
 * before the UI lays out.
 *
 * @see https://github.com/blackboardsh/electrobun/issues/431
 */
export function refreshWebviewLayout(win: BrowserWindow) {
	if (process.platform !== "win32") return;

	const { width, height } = win.getSize();
	win.setSize(width, height - 1);
	setTimeout(() => win.setSize(width, height), 0);
}

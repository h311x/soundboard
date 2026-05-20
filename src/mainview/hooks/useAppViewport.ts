import { useEffect } from "react";
import { setRelayoutHandler } from "../rpc";

/**
 * WebView2 often reports a viewport larger than the visible client area (content
 * clipped on the right and bottom). Use the smallest trusted dimension metric.
 */
function readViewportSize(): { width: number; height: number } {
	const root = document.documentElement;
	const vv = window.visualViewport;
	const candidatesW = [
		root.clientWidth,
		window.innerWidth,
		vv?.width ?? Number.POSITIVE_INFINITY,
	].filter((n) => n > 0);
	const candidatesH = [
		root.clientHeight,
		window.innerHeight,
		vv?.height ?? Number.POSITIVE_INFINITY,
	].filter((n) => n > 0);

	return {
		width: Math.floor(Math.min(...candidatesW)),
		height: Math.floor(Math.min(...candidatesH)),
	};
}

function syncViewportSize() {
	const { width, height } = readViewportSize();
	const root = document.documentElement;
	if (width > 0) root.style.setProperty("--app-width", `${width}px`);
	if (height > 0) root.style.setProperty("--app-height", `${height}px`);
}

/** Keeps layout in sync with the webview client area (fixes initial crop on Windows WebView2). */
export function useAppViewport() {
	useEffect(() => {
		setRelayoutHandler(syncViewportSize);
		syncViewportSize();

		const raf = requestAnimationFrame(syncViewportSize);
		const delays = [0, 50, 150, 400, 800, 1200].map((ms) =>
			window.setTimeout(syncViewportSize, ms),
		);

		const ro = new ResizeObserver(syncViewportSize);
		ro.observe(document.documentElement);
		if (document.body) ro.observe(document.body);

		window.addEventListener("resize", syncViewportSize);
		window.visualViewport?.addEventListener("resize", syncViewportSize);
		window.visualViewport?.addEventListener("scroll", syncViewportSize);

		return () => {
			setRelayoutHandler(() => {});
			cancelAnimationFrame(raf);
			for (const id of delays) window.clearTimeout(id);
			ro.disconnect();
			window.removeEventListener("resize", syncViewportSize);
			window.visualViewport?.removeEventListener("resize", syncViewportSize);
			window.visualViewport?.removeEventListener("scroll", syncViewportSize);
		};
	}, []);
}

import { useEffect } from "react";
import { setRelayoutHandler } from "../rpc";

const isWindows =
	typeof document !== "undefined" &&
	document.documentElement.dataset.platform === "windows";

/**
 * WebView2 often reports a layout size larger than the painted webview bounds
 * (clip on right/bottom), especially with the native Windows title bar.
 * visualViewport tracks the actually visible area; fall back to scale when needed.
 */
function syncViewportSize() {
	const root = document.documentElement;
	const vv = window.visualViewport;

	const layoutW = root.clientWidth;
	const layoutH = root.clientHeight;
	const paintW = Math.floor(vv?.width ?? layoutW);
	const paintH = Math.floor(vv?.height ?? layoutH);

	if (isWindows && vv) {
		if (paintW > 0) root.style.setProperty("--app-width", `${paintW}px`);
		if (paintH > 0) root.style.setProperty("--app-height", `${paintH}px`);
		root.style.removeProperty("--viewport-scale");
		return;
	}

	let scale = 1;
	if (layoutW > 0 && paintW > 0) scale = Math.min(scale, paintW / layoutW);
	if (layoutH > 0 && paintH > 0) scale = Math.min(scale, paintH / layoutH);

	if (scale < 0.999) {
		root.style.setProperty("--viewport-scale", String(scale));
		root.style.removeProperty("--app-width");
		root.style.removeProperty("--app-height");
	} else {
		root.style.removeProperty("--viewport-scale");
		root.style.removeProperty("--app-width");
		root.style.removeProperty("--app-height");
	}
}

/** Keeps layout in sync with the webview client area (fixes initial crop on Windows WebView2). */
export function useAppViewport() {
	useEffect(() => {
		setRelayoutHandler(syncViewportSize);
		syncViewportSize();

		const raf = requestAnimationFrame(syncViewportSize);
		const delays = [0, 50, 150, 400, 800, 1200, 2000].map((ms) =>
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

import { useEffect } from "react";
import { setRelayoutHandler } from "../rpc";

/**
 * WebView2 can report a layout viewport larger than the painted area (clip right/bottom).
 * Scale the shell down when inner size is smaller than the layout client size.
 */
function syncViewportSize() {
	const root = document.documentElement;
	const clientW = root.clientWidth;
	const clientH = root.clientHeight;
	const innerW = window.innerWidth;
	const innerH = window.innerHeight;

	let scale = 1;
	if (clientW > 0 && innerW > 0) scale = Math.min(scale, innerW / clientW);
	if (clientH > 0 && innerH > 0) scale = Math.min(scale, innerH / clientH);

	if (scale < 0.999) {
		root.style.setProperty("--viewport-scale", String(scale));
	} else {
		root.style.removeProperty("--viewport-scale");
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

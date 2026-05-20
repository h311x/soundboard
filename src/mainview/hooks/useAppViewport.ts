import { useEffect } from "react";
import { setRelayoutHandler } from "../rpc";

function syncViewportSize() {
	const root = document.documentElement;
	const w = root.clientWidth;
	const h = root.clientHeight;
	if (w > 0) root.style.setProperty("--app-width", `${w}px`);
	if (h > 0) root.style.setProperty("--app-height", `${h}px`);
}

/** Keeps layout in sync with the webview client area (fixes initial crop on Windows WebView2). */
export function useAppViewport() {
	useEffect(() => {
		setRelayoutHandler(syncViewportSize);
		syncViewportSize();

		const raf = requestAnimationFrame(syncViewportSize);
		const delays = [0, 50, 150, 400, 800].map((ms) =>
			window.setTimeout(syncViewportSize, ms),
		);

		const ro = new ResizeObserver(syncViewportSize);
		ro.observe(document.documentElement);

		window.addEventListener("resize", syncViewportSize);
		window.visualViewport?.addEventListener("resize", syncViewportSize);

		return () => {
			setRelayoutHandler(() => {});
			cancelAnimationFrame(raf);
			for (const id of delays) window.clearTimeout(id);
			ro.disconnect();
			window.removeEventListener("resize", syncViewportSize);
			window.visualViewport?.removeEventListener("resize", syncViewportSize);
		};
	}, []);
}

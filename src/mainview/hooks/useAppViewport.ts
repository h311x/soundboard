import { useEffect } from "react";

/** Keeps layout in sync with the webview client area (100vh is wrong until resize on Windows). */
export function useAppViewport() {
	useEffect(() => {
		const sync = () => {
			const h = window.visualViewport?.height ?? window.innerHeight;
			document.documentElement.style.setProperty("--app-height", `${h}px`);
		};

		sync();
		requestAnimationFrame(sync);
		const t0 = window.setTimeout(sync, 0);
		const t1 = window.setTimeout(sync, 120);

		window.addEventListener("resize", sync);
		window.visualViewport?.addEventListener("resize", sync);

		return () => {
			window.clearTimeout(t0);
			window.clearTimeout(t1);
			window.removeEventListener("resize", sync);
			window.visualViewport?.removeEventListener("resize", sync);
		};
	}, []);
}

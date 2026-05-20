import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./rpc";
import App from "./App";

const ua = navigator.userAgent;
if (/Mac|iPhone|iPad|iPod/.test(ua)) {
	document.documentElement.dataset.platform = "macos";
} else if (/Windows/.test(ua)) {
	document.documentElement.dataset.platform = "windows";
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

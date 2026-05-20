import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./rpc";
import App from "./App";

if (/Mac|iPhone|iPad|iPod/.test(navigator.userAgent)) {
	document.documentElement.dataset.platform = "macos";
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

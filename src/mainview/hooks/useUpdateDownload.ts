import type { UpdateDownloadState, UpdateInfo } from "@shared/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { getRpc, setUpdateDownloadHandler } from "../rpc";

const POLL_MS = 1000;

export function useUpdateDownload(
	showToast: (message: string, variant?: "info" | "error") => void,
) {
	const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
	const [downloading, setDownloading] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | undefined>();
	const downloadingRef = useRef(false);

	const applyDownloadState = useCallback((state: UpdateDownloadState) => {
		setUpdateInfo(state);
		setStatusMessage(state.statusMessage);
		setDownloading(state.downloading);
		downloadingRef.current = state.downloading;

		if (state.updateReady) {
			setDownloading(false);
			downloadingRef.current = false;
			return;
		}

		if (state.error && !state.downloading) {
			setDownloading(false);
			downloadingRef.current = false;
			showToast(state.error, "error");
		}
	}, [showToast]);

	useEffect(() => {
		setUpdateDownloadHandler(applyDownloadState);
		return () => setUpdateDownloadHandler(null);
	}, [applyDownloadState]);

	useEffect(() => {
		if (!downloading) return;

		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;

		const poll = async () => {
			if (cancelled || !downloadingRef.current) return;
			try {
				const state = await getRpc().request.getDownloadStatus({});
				applyDownloadState(state);
				if (!cancelled && downloadingRef.current) {
					timer = setTimeout(() => void poll(), POLL_MS);
				}
			} catch (e) {
				console.error(e);
				if (!cancelled) {
					setDownloading(false);
					downloadingRef.current = false;
					showToast("Could not check update status", "error");
				}
			}
		};

		void poll();

		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
		};
	}, [downloading, applyDownloadState, showToast]);

	const startDownload = useCallback(async () => {
		try {
			const result = await getRpc().request.beginDownloadUpdate({});
			applyDownloadState(result.state);
			if (result.state.updateReady) return;
			setDownloading(true);
			downloadingRef.current = true;
		} catch (e) {
			console.error(e);
			const detail = e instanceof Error ? e.message : String(e);
			showToast(
				detail ? `Update download failed: ${detail}` : "Update download failed",
				"error",
			);
		}
	}, [applyDownloadState, showToast]);

	const checkForUpdates = useCallback(async () => {
		try {
			const info = await getRpc().request.checkForUpdates({});
			setUpdateInfo(info);
		} catch (e) {
			console.error("Update check failed:", e);
		}
	}, []);

	return {
		updateInfo,
		setUpdateInfo,
		downloading,
		statusMessage,
		startDownload,
		checkForUpdates,
	};
}

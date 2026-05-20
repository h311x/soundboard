import type { UpdateDownloadState, UpdateInfo } from "@shared/types";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type MutableRefObject,
} from "react";
import { getRpc, setUpdateDownloadHandler } from "../rpc";

const POLL_MS = 1000;

export function useUpdateDownload(
	showToast: (message: string, variant?: "info" | "error") => void,
) {
	const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
	const [downloading, setDownloading] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | undefined>();
	const downloadingRef = useRef(false);

	const applyDownloadState = useCallback(
		(state: UpdateDownloadState) => {
			applyReadyState(state, downloadingRef, setDownloading);
			setUpdateInfo(state);
			setStatusMessage(state.statusMessage);
			reportDownloadError(state, showToast, downloadingRef, setDownloading);
		},
		[showToast],
	);

	useEffect(() => {
		setUpdateDownloadHandler(applyDownloadState);
		return () => setUpdateDownloadHandler(null);
	}, [applyDownloadState]);

	useEffect(() => {
		if (!downloading) return;
		return startDownloadPolling(
			applyDownloadState,
			downloadingRef,
			setDownloading,
			showToast,
		);
	}, [downloading, applyDownloadState, showToast]);

	const startDownload = useCallback(async () => {
		try {
			const result = await getRpc().request.beginDownloadUpdate({});
			applyDownloadState(result.state);
			if (result.state.updateReady) return;
			setDownloading(true);
			downloadingRef.current = true;
		} catch (e) {
			reportStartDownloadError(e, showToast);
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

function applyReadyState(
	state: UpdateDownloadState,
	downloadingRef: MutableRefObject<boolean>,
	setDownloading: (v: boolean) => void,
): void {
	if (!state.updateReady) return;
	setDownloading(false);
	downloadingRef.current = false;
}

function reportDownloadError(
	state: UpdateDownloadState,
	showToast: (message: string, variant?: "info" | "error") => void,
	downloadingRef: MutableRefObject<boolean>,
	setDownloading: (v: boolean) => void,
): void {
	if (!state.error || state.downloading) return;
	setDownloading(false);
	downloadingRef.current = false;
	showToast(state.error, "error");
}

function startDownloadPolling(
	applyDownloadState: (state: UpdateDownloadState) => void,
	downloadingRef: MutableRefObject<boolean>,
	setDownloading: (v: boolean) => void,
	showToast: (message: string, variant?: "info" | "error") => void,
): () => void {
	let cancelled = false;
	let timer: ReturnType<typeof setTimeout> | null = null;

	const pollOnce = async () => {
		if (shouldStopPolling(cancelled, downloadingRef)) return;
		try {
			await pollDownloadStatus(applyDownloadState, downloadingRef, () => {
				if (shouldStopPolling(cancelled, downloadingRef)) return;
				timer = setTimeout(() => void pollOnce(), POLL_MS);
			});
		} catch (e) {
			handlePollError(e, cancelled, downloadingRef, setDownloading, showToast);
		}
	};

	void pollOnce();

	return () => {
		cancelled = true;
		if (timer) clearTimeout(timer);
	};
}

function shouldStopPolling(
	cancelled: boolean,
	downloadingRef: MutableRefObject<boolean>,
): boolean {
	return cancelled || !downloadingRef.current;
}

async function pollDownloadStatus(
	applyDownloadState: (state: UpdateDownloadState) => void,
	downloadingRef: MutableRefObject<boolean>,
	scheduleNext: () => void,
): Promise<void> {
	const state = await getRpc().request.getDownloadStatus({});
	applyDownloadState(state);
	if (!downloadingRef.current) return;
	scheduleNext();
}

function handlePollError(
	e: unknown,
	cancelled: boolean,
	downloadingRef: MutableRefObject<boolean>,
	setDownloading: (v: boolean) => void,
	showToast: (message: string, variant?: "info" | "error") => void,
): void {
	console.error(e);
	if (cancelled) return;
	setDownloadPollingFailed(downloadingRef, setDownloading, showToast);
}

function setDownloadPollingFailed(
	downloadingRef: MutableRefObject<boolean>,
	setDownloading: (v: boolean) => void,
	showToast: (message: string, variant?: "info" | "error") => void,
): void {
	downloadingRef.current = false;
	setDownloading(false);
	showToast("Could not check update status", "error");
}

function reportStartDownloadError(
	e: unknown,
	showToast: (message: string, variant?: "info" | "error") => void,
): void {
	console.error(e);
	const detail = e instanceof Error ? e.message : String(e);
	showToast(
		detail ? `Update download failed: ${detail}` : "Update download failed",
		"error",
	);
}

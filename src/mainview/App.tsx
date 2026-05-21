import type { AppState, Clip, PlaybackSnapshot } from "@shared/types";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { createGlobalHotkeyListener } from "./app/globalHotkeys";
import { playClip } from "./app/playClip";
import { AppLoaded } from "./components/AppLoaded";
import { AppLoading } from "./components/AppLoading";
import { audioEngine } from "./audio/engine";
import { hostPlaybackStore } from "./audio/hostPlayback";
import { applyAccentPreset } from "./theme/presets";
import { useUpdateDownload } from "./hooks/useUpdateDownload";
import { getRpc, setRpcHandlers } from "./rpc";

const EMPTY_PLAYBACK: PlaybackSnapshot = { progress: {}, playing: {} };

export default function App() {
	const model = useAppModel();
	if (!model.state) return <AppLoading />;
	return <AppLoaded model={{ ...model, state: model.state }} />;
}

function useAppModel() {
	const [state, setState] = useState<AppState | null>(null);
	const [toast, setToast] = useState<AppToast | null>(null);
	const [editClip, setEditClip] = useState<Clip | null>(null);
	const [hotkeyClip, setHotkeyClip] = useState<Clip | null>(null);
	const [showThemePicker, setShowThemePicker] = useState(false);
	const [audioBlocked, setAudioBlocked] = useState(false);
	const stateRef = useRef<AppState | null>(null);
	const hostAudio = state?.capabilities?.hostAudio ?? false;

	const showToast = useCallback((message: string, variant?: AppToast["variant"]) => {
		setToast({ message, variant });
		setTimeout(() => setToast(null), 4000);
	}, []);

	const syncAudio = useCallback(async (appState: AppState) => {
		if (appState.capabilities.hostAudio) return;
		audioEngine.setMasterVolume(appState.board.masterVolume);
		for (const clip of appState.board.clips) {
			audioEngine.setClipVolume(clip.id, clip.volume);
		}
		await audioEngine.preloadAll(appState.board.clips);
	}, []);

	const {
		updateInfo,
		downloading: updateDownloading,
		statusMessage: updateStatusMessage,
		startDownload,
		checkForUpdates,
		dismissUpdate,
	} = useUpdateDownload(showToast);

	const applyStateSync = useCallback((appState: AppState) => {
		stateRef.current = appState;
		setState(appState);
		applyAccentPreset(appState.settings.accentPreset);
	}, []);

	const applyState = useCallback(
		async (appState: AppState) => {
			applyStateSync(appState);
			await syncAudio(appState);
		},
		[applyStateSync, syncAudio],
	);

	const getState = useCallback(() => stateRef.current, []);

	const onPlay = useCallback(
		(clip: Clip) => {
			void playClip(clip, { getState, showToast, setAudioBlocked });
		},
		[getState, showToast],
	);

	useEffect(() => {
		stateRef.current = state;
	});

	useEffect(() => {
		const listener = createGlobalHotkeyListener(
			getState,
			() => Boolean(hotkeyClip || editClip),
			onPlay,
		);
		window.addEventListener("keydown", listener, true);
		return () => window.removeEventListener("keydown", listener, true);
	}, [hotkeyClip, editClip, getState, onPlay]);

	useEffect(() => {
		setRpcHandlers({
			onStateChanged: (s) => void applyState(s),
			onPlayClip: (id) => {
				const clip = stateRef.current?.board.clips.find((c) => c.id === id);
				if (clip) onPlay(clip);
			},
			onStopAll: () => stopAllPlayback(stateRef.current),
			onShowToast: showToast,
		});

		void getRpc().request.getState({}).then(applyState).catch(console.error);
	}, [applyState, onPlay, showToast]);

	useEffect(() => {
		void checkForUpdates();
	}, [checkForUpdates]);

	useEffect(() => {
		const unlock = () => {
			void audioEngine.unlock().then((ok) => {
				if (ok) setAudioBlocked(false);
			});
		};
		window.addEventListener("click", unlock);
		return () => window.removeEventListener("click", unlock);
	}, []);

	const playback = usePlaybackSnapshot(hostAudio);

	return {
		state,
		toast,
		editClip,
		hotkeyClip,
		showThemePicker,
		audioBlocked,
		playback,
		getState,
		applyState,
		applyStateSync,
		showToast,
		onPlay,
		setEditClip,
		setHotkeyClip,
		setShowThemePicker,
		setToast,
		updateInfo,
		updateDownloading,
		updateStatusMessage,
		startDownload,
		dismissUpdate,
	};
}

type AppToast = { message: string; variant?: "info" | "error" };

function stopAllPlayback(state: AppState | null): void {
	if (state?.capabilities.hostAudio) {
		void getRpc().request.stopAllAudio({});
		return;
	}
	audioEngine.stopAll();
}

function usePlaybackSnapshot(hostAudio: boolean): PlaybackSnapshot {
	const subscribe = useCallback(
		(onStoreChange: () => void) =>
			hostAudio
				? hostPlaybackStore.subscribe(onStoreChange)
				: audioEngine.subscribeProgress(onStoreChange),
		[hostAudio],
	);

	const getSnapshot = useCallback(
		(): PlaybackSnapshot =>
			hostAudio
				? hostPlaybackStore.getSnapshot()
				: audioEngine.getPlaybackSnapshot(),
		[hostAudio],
	);

	return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_PLAYBACK);
}

import type { AppState, Clip, PlaybackSnapshot, UpdateInfo } from "@shared/types";
import { AppMain } from "./AppMain";
import type { AppToastState } from "./AppMain";

export type AppModel = {
	state: AppState;
	toast: AppToastState;
	editClip: Clip | null;
	hotkeyClip: Clip | null;
	showThemePicker: boolean;
	audioBlocked: boolean;
	playback: PlaybackSnapshot;
	getState: () => AppState | null;
	applyState: (s: AppState) => Promise<void>;
	showToast: (message: string, variant?: "info" | "error") => void;
	onPlay: (clip: Clip) => void;
	setEditClip: (clip: Clip | null) => void;
	setHotkeyClip: (clip: Clip | null) => void;
	setShowThemePicker: (v: boolean | ((s: boolean) => boolean)) => void;
	setToast: (toast: AppToastState) => void;
	setUpdateInfo: (info: UpdateInfo | null) => void;
	updateInfo: UpdateInfo | null;
	updateDownloading: boolean;
	updateStatusMessage?: string;
	startDownload: () => void;
};

export function AppLoaded({ model }: { model: AppModel }) {
	return (
		<AppMain
			state={model.state}
			playback={model.playback}
			getState={model.getState}
			applyState={model.applyState}
			showToast={model.showToast}
			toast={model.toast}
			onDismissToast={() => model.setToast(null)}
			audioBlocked={model.audioBlocked}
			showThemePicker={model.showThemePicker}
			onToggleTheme={() => model.setShowThemePicker((s) => !s)}
			onCloseTheme={() => model.setShowThemePicker(false)}
			updateInfo={model.updateInfo}
			updateDownloading={model.updateDownloading}
			updateStatusMessage={model.updateStatusMessage}
			onStartDownload={() => void model.startDownload()}
			onDismissUpdate={() => model.setUpdateInfo(null)}
			editClip={model.editClip}
			hotkeyClip={model.hotkeyClip}
			onEditClip={model.setEditClip}
			onHotkeyClip={model.setHotkeyClip}
			onPlay={model.onPlay}
		/>
	);
}

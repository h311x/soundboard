import type { AppState, Clip, UpdateInfo } from "@shared/types";
import { appStateWithMasterVolume } from "../app/clipDrag";
import type { AppCoreProps } from "../app/appCoreProps";
import { audioEngine } from "../audio/engine";
import { allowFileDrop, importDroppedFiles } from "../app/fileDrop";
import { getRpc } from "../rpc";
import { AppClipGrid } from "./AppClipGrid";
import { AppModals } from "./AppModals";
import { EmptyState } from "./EmptyState";
import { Toast } from "./Toast";
import { Toolbar } from "./Toolbar";
import { UpdateBanner } from "./UpdateBanner";

export type AppToastState = { message: string; variant?: "info" | "error" } | null;

export type AppMainProps = AppCoreProps & {
	toast: AppToastState;
	onDismissToast: () => void;
	audioBlocked: boolean;
	showThemePicker: boolean;
	onToggleTheme: () => void;
	onCloseTheme: () => void;
	updateInfo: UpdateInfo | null;
	updateDownloading: boolean;
	updateStatusMessage?: string;
	onStartDownload: () => void;
	onDismissUpdate: () => void;
	editClip: Clip | null;
	hotkeyClip: Clip | null;
	onEditClip: (clip: Clip | null) => void;
	onHotkeyClip: (clip: Clip | null) => void;
	onPlay: (clip: Clip) => void;
};

export function AppMain(props: AppMainProps) {
	return (
		<div
			className="app-shell"
			onDragEnterCapture={allowFileDrop}
			onDragOverCapture={allowFileDrop}
			onDrop={(e) => onAppDrop(e, props.applyState, props.showToast)}
		>
			<div className="bg-mesh" aria-hidden />
			<AppToolbarSection {...props} />
			<AppUpdateSection {...props} />
			<AppAudioHint state={props.state} audioBlocked={props.audioBlocked} />
			<AppMainContent {...props} />
			<AppModals
				editClip={props.editClip}
				hotkeyClip={props.hotkeyClip}
				applyState={props.applyState}
				showToast={props.showToast}
				onCloseEdit={() => props.onEditClip(null)}
				onCloseHotkey={() => props.onHotkeyClip(null)}
			/>
			<AppToast toast={props.toast} onDismiss={props.onDismissToast} />
		</div>
	);
}

function onAppDrop(
	e: React.DragEvent,
	applyState: (s: AppState) => Promise<void>,
	showToast: AppMainProps["showToast"],
): void {
	e.preventDefault();
	void importDroppedFiles(
		Array.from(e.dataTransfer.files),
		applyState,
		showToast,
	);
}

function AppMainContent(props: AppMainProps) {
	const empty = props.state.board.clips.length === 0;
	const mainClass = empty ? "main-content main-content--empty" : "main-content";
	return (
		<main className={mainClass}>
			{empty ? (
				<EmptyState onImport={() => void importViaDialog(props.applyState)} />
			) : (
				<AppClipGrid
					state={props.state}
					playback={props.playback}
					getState={props.getState}
					applyStateSync={props.applyStateSync}
					onPlay={props.onPlay}
					onEdit={(clip) => props.onEditClip(clip)}
					onEditHotkey={(clip) => props.onHotkeyClip(clip)}
				/>
			)}
		</main>
	);
}

function AppToast({
	toast,
	onDismiss,
}: {
	toast: AppToastState;
	onDismiss: () => void;
}) {
	if (!toast) return null;
	return (
		<Toast message={toast.message} variant={toast.variant} onDismiss={onDismiss} />
	);
}

function AppToolbarSection({
	state,
	showThemePicker,
	onToggleTheme,
	onCloseTheme,
	applyState,
	getState,
	applyStateSync,
}: AppMainProps) {
	return (
		<Toolbar
			masterVolume={state.board.masterVolume}
			alwaysOnTop={state.settings.alwaysOnTop}
			showThemePicker={showThemePicker}
			accentPreset={state.settings.accentPreset}
			onImport={() => void importViaDialog(applyState)}
			onStopAll={() => stopAllSounds(state)}
			onMasterVolumePreview={(v) => previewMasterVolume(v, state)}
			onMasterVolumeCommit={(v) => commitMasterVolume(v, getState, applyStateSync)}
			onAlwaysOnTop={(enabled) =>
				void getRpc().request.setAlwaysOnTop({ enabled }).then(applyState)
			}
			onAccent={(preset) =>
				void getRpc().request.setAccentPreset({ preset }).then(applyState)
			}
			onToggleTheme={onToggleTheme}
			onCloseTheme={onCloseTheme}
		/>
	);
}

function AppUpdateSection({
	updateInfo,
	updateDownloading,
	updateStatusMessage,
	onStartDownload,
	onDismissUpdate,
}: AppMainProps) {
	if (!updateInfo?.updateAvailable) return null;
	return (
		<UpdateBanner
			version={updateInfo.version}
			ready={updateInfo.updateReady}
			downloading={updateDownloading}
			statusMessage={updateStatusMessage}
			onDownload={onStartDownload}
			onApply={() => void getRpc().request.applyUpdate({})}
			onDismiss={onDismissUpdate}
		/>
	);
}

function AppAudioHint({
	state,
	audioBlocked,
}: {
	state: AppState;
	audioBlocked: boolean;
}) {
	if (!audioBlocked || state.capabilities.hostAudio) return null;
	return (
		<div className="audio-hint glass-panel">
			Click anywhere to enable audio playback
		</div>
	);
}

function importViaDialog(applyState: (s: AppState) => Promise<void>): void {
	void getRpc().request.importViaDialog({}).then(applyState);
}

function stopAllSounds(state: AppState): void {
	if (state.capabilities.hostAudio) {
		void getRpc().request.stopAllAudio({});
		return;
	}
	audioEngine.stopAll();
}

function previewMasterVolume(volume: number, state: AppState): void {
	if (state.capabilities.hostAudio) {
		void getRpc().request.previewMasterVolume({ volume });
		return;
	}
	audioEngine.setMasterVolume(volume);
}

function commitMasterVolume(
	volume: number,
	getState: () => AppState | null,
	applyStateSync: (s: AppState) => void,
): void {
	const current = getState();
	if (current) applyStateSync(appStateWithMasterVolume(current, volume));
	void getRpc().request.setMasterVolume({ volume });
}

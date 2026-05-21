import type { AppState, Clip, UpdateInfo } from "@shared/types";
import { appStateWithMasterVolume } from "../app/clipDrag";
import { updateBannerKey } from "../app/updateState";
import type { AppCoreProps } from "../app/appCoreProps";
import { audioEngine } from "../audio/engine";
import { allowFileDrop, importDroppedFiles } from "../app/fileDrop";
import { getRpc } from "../rpc";
import { cn } from "../utils/cn";
import { AppClipGrid } from "./AppClipGrid";
import { AppModals } from "./AppModals";
import { EmptyState } from "./EmptyState";
import { Toast } from "./Toast";
import { Toolbar } from "./Toolbar";
import { UpdateBanner } from "./UpdateBanner";
import { GlassPanel } from "./ui/GlassPanel";

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
			className="select-none-root fixed inset-0 z-[1] flex min-h-0 min-w-0 flex-col overflow-hidden [&>.titlebar]:shrink-0 [&>header]:shrink-0"
			onDragEnterCapture={allowFileDrop}
			onDragOverCapture={allowFileDrop}
			onDrop={(e) => onAppDrop(e, props.applyState, props.showToast)}
		>
			<div
				className="pointer-events-none fixed inset-0 z-0 bg-[var(--bg-base)] bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,hsl(var(--mesh-hsl)/0.9)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_90%_100%,hsl(var(--mesh-hsl)/0.7)_0%,transparent_55%)]"
				aria-hidden
			/>
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
	return (
		<main
			className={cn(
				"relative z-[1] min-h-0 flex-1 overflow-auto px-4 py-3",
				empty && "flex items-center justify-center before:pointer-events-none before:absolute before:inset-x-5 before:top-4 before:bottom-5 before:z-0 before:rounded-[var(--radius-lg)] before:border before:border-dashed before:border-[hsl(var(--accent-hsl)/0.18)] before:content-['']",
			)}
		>
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
	const info = updateInfo;
	const bannerKey = updateBannerKey(info);
	if (!info || !bannerKey) return null;
	return (
		<div className="shrink-0 px-0 py-3 pb-3.5">
			<UpdateBanner
				key={bannerKey}
				version={info.version}
				ready={info.updateReady}
				downloading={updateDownloading}
				statusMessage={updateStatusMessage}
				onDownload={onStartDownload}
				onApply={() => void getRpc().request.applyUpdate({})}
				onDismiss={onDismissUpdate}
			/>
		</div>
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
		<GlassPanel className="mx-5 shrink-0 px-3.5 py-2.5 text-center text-[0.85rem] text-[var(--text-muted)] rounded-[var(--radius-sm)]">
			Click anywhere to enable audio playback
		</GlassPanel>
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

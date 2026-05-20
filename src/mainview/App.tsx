import type { AppState, Clip } from "@shared/types";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { audioEngine } from "./audio/engine";
import { ClipPad } from "./components/ClipPad";
import { EditClipModal } from "./components/EditClipModal";
import { HotkeyModal } from "./components/HotkeyModal";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import { UpdateBanner } from "./components/UpdateBanner";
import type { UpdateInfo } from "@shared/types";
import { getRpc, setRpcHandlers } from "./rpc";
import { applyAccentPreset } from "./theme/presets";
import { useAppViewport } from "./hooks/useAppViewport";
import { eventToAccelerator } from "./utils/hotkey";

type ToastState = { message: string; variant?: "info" | "error" } | null;

export default function App() {
	useAppViewport();
	const [state, setState] = useState<AppState | null>(null);
	const [toast, setToast] = useState<ToastState>(null);
	const [editClip, setEditClip] = useState<Clip | null>(null);
	const [hotkeyClip, setHotkeyClip] = useState<Clip | null>(null);
	const playback = useSyncExternalStore(
		(onStoreChange) => audioEngine.subscribeProgress(onStoreChange),
		() => audioEngine.getPlaybackSnapshot(),
		() => ({ progress: {}, playing: {} }),
	);
	const [showThemePicker, setShowThemePicker] = useState(false);
	const [dragId, setDragId] = useState<string | null>(null);
	const [dragOverId, setDragOverId] = useState<string | null>(null);
	const reorderStartRef = useRef<{ id: string; x: number; y: number } | null>(
		null,
	);
	const REORDER_THRESHOLD_PX = 8;
	const [audioBlocked, setAudioBlocked] = useState(false);
	const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
	const [updateDownloading, setUpdateDownloading] = useState(false);
	const stateRef = useRef<AppState | null>(null);

	const showToast = useCallback((message: string, variant?: "info" | "error") => {
		setToast({ message, variant });
		setTimeout(() => setToast(null), 4000);
	}, []);

	const syncAudio = useCallback(async (appState: AppState) => {
		audioEngine.setMasterVolume(appState.board.masterVolume);
		for (const clip of appState.board.clips) {
			audioEngine.setClipVolume(clip.id, clip.volume);
		}
		await audioEngine.preloadAll(appState.board.clips);
	}, []);

	const applyState = useCallback(
		async (appState: AppState) => {
			stateRef.current = appState;
			setState(appState);
			applyAccentPreset(appState.settings.accentPreset);
			await syncAudio(appState);
		},
		[syncAudio],
	);

	const playClip = useCallback(
		async (clip: Clip) => {
			if (clip.missing) {
				showToast("Sound file is missing", "error");
				return;
			}
			try {
				if (!audioEngine.isUnlocked()) {
					await audioEngine.loadClip(clip.id, clip.fileName);
				}
				const ok = await audioEngine.play(clip.id, clip.volume);
				if (!ok) {
					setAudioBlocked(true);
					showToast("Click anywhere in the app once to enable sound", "info");
					return;
				}
				setAudioBlocked(false);
			} catch (e) {
				console.error(e);
				showToast("Failed to play sound", "error");
			}
		},
		[showToast],
	);

	useEffect(() => {
		stateRef.current = state;
	});

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (hotkeyClip || editClip) return;
			const target = e.target;
			if (
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				(target instanceof HTMLElement && target.isContentEditable)
			) {
				return;
			}

			const accel = eventToAccelerator(e);
			if (!accel) return;

			const clip = stateRef.current?.board.clips.find((c) => c.hotkey === accel);
			if (!clip || clip.missing) return;

			e.preventDefault();
			e.stopPropagation();
			void playClip(clip);
		};

		window.addEventListener("keydown", onKeyDown, true);
		return () => window.removeEventListener("keydown", onKeyDown, true);
	}, [hotkeyClip, editClip, playClip]);

	useEffect(() => {
		setRpcHandlers({
			onStateChanged: (s) => void applyState(s),
			onPlayClip: (id) => {
				const clip = stateRef.current?.board.clips.find((c) => c.id === id);
				if (clip) void playClip(clip);
			},
			onStopAll: () => {
				audioEngine.stopAll();
			},
			onShowToast: showToast,
		});

		void getRpc().request.getState({}).then(applyState).catch(console.error);

		void getRpc()
			.request.checkForUpdates({})
			.then((info) => {
				if (info.updateAvailable) setUpdateInfo(info);
			})
			.catch(console.error);
	}, [applyState, playClip, showToast]);

	useEffect(() => {
		const unlock = () => {
			void audioEngine.unlock().then((ok) => {
				if (ok) setAudioBlocked(false);
			});
		};
		window.addEventListener("click", unlock);
		return () => window.removeEventListener("click", unlock);
	}, []);

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		const files = Array.from(e.dataTransfer.files);
		if (!files.length) return;

		const payloads: { name: string; data: number[] }[] = [];
		for (const file of files) {
			const buf = await file.arrayBuffer();
			payloads.push({
				name: file.name,
				data: Array.from(new Uint8Array(buf)),
			});
		}
		try {
			const s = await getRpc().request.importFileData({ files: payloads });
			await applyState(s);
			showToast(`Imported ${payloads.length} sound(s)`);
		} catch (err) {
			console.error(err);
			showToast("Import failed", "error");
		}
	};

	const reorder = useCallback(async (fromId: string, toId: string) => {
		const current = stateRef.current;
		if (!current || fromId === toId) return;
		const ids = current.board.clips.map((c) => c.id);
		const fromIdx = ids.indexOf(fromId);
		const toIdx = ids.indexOf(toId);
		if (fromIdx < 0 || toIdx < 0) return;
		ids.splice(fromIdx, 1);
		ids.splice(toIdx, 0, fromId);
		const s = await getRpc().request.reorderClips({ ids });
		await applyState(s);
	}, [applyState]);

	const dragActiveRef = useRef<string | null>(null);
	const dragOverRef = useRef<string | null>(null);

	useEffect(() => {
		const onMove = (e: PointerEvent) => {
			const start = reorderStartRef.current;
			if (!start) return;
			const dx = e.clientX - start.x;
			const dy = e.clientY - start.y;
			if (
				!dragActiveRef.current &&
				dx * dx + dy * dy >= REORDER_THRESHOLD_PX * REORDER_THRESHOLD_PX
			) {
				dragActiveRef.current = start.id;
				setDragId(start.id);
			}
			if (!dragActiveRef.current) return;
			const el = document.elementFromPoint(e.clientX, e.clientY);
			const card = el?.closest("[data-clip-id]");
			const overId = card?.getAttribute("data-clip-id");
			if (overId && overId !== dragActiveRef.current) {
				dragOverRef.current = overId;
				setDragOverId(overId);
			}
		};

		const finishReorder = () => {
			const from = dragActiveRef.current;
			const to = dragOverRef.current;
			if (from && to && from !== to) void reorder(from, to);
			reorderStartRef.current = null;
			dragActiveRef.current = null;
			dragOverRef.current = null;
			setDragId(null);
			setDragOverId(null);
		};

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", finishReorder);
		window.addEventListener("pointercancel", finishReorder);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", finishReorder);
			window.removeEventListener("pointercancel", finishReorder);
		};
	}, [reorder]);

	if (!state) {
		return (
			<div className="app-shell loading">
				<div className="glass-panel">Loading…</div>
			</div>
		);
	}

	const clips = state.board.clips;

	return (
		<div
			className="app-shell"
			onDragOver={(e) => e.preventDefault()}
			onDrop={handleDrop}
		>
			<div className="bg-mesh" aria-hidden />

			<Toolbar
				masterVolume={state.board.masterVolume}
				alwaysOnTop={state.settings.alwaysOnTop}
				showThemePicker={showThemePicker}
				accentPreset={state.settings.accentPreset}
				onImport={() => void getRpc().request.importViaDialog({}).then(applyState)}
				onStopAll={() => audioEngine.stopAll()}
				onMasterVolumePreview={(v) => audioEngine.setMasterVolume(v)}
				onMasterVolumeCommit={(v) =>
					void getRpc().request.setMasterVolume({ volume: v }).then(applyState)
				}
				onAlwaysOnTop={(enabled) =>
					void getRpc().request.setAlwaysOnTop({ enabled }).then(applyState)
				}
				onAccent={(preset) =>
					void getRpc().request.setAccentPreset({ preset }).then(applyState)
				}
				onToggleTheme={() => setShowThemePicker((s) => !s)}
				onCloseTheme={() => setShowThemePicker(false)}
			/>

			{updateInfo?.updateAvailable && (
				<UpdateBanner
					version={updateInfo.version}
					ready={updateInfo.updateReady}
					downloading={updateDownloading}
					onDownload={() => {
						setUpdateDownloading(true);
						void getRpc()
							.request.downloadUpdate({})
							.then((info) => {
								setUpdateInfo(info);
								setUpdateDownloading(false);
							})
							.catch(() => setUpdateDownloading(false));
					}}
					onApply={() => void getRpc().request.applyUpdate({})}
					onDismiss={() => setUpdateInfo(null)}
				/>
			)}

			{audioBlocked && (
				<div className="audio-hint glass-panel">
					Click anywhere to enable audio playback
				</div>
			)}

			<main
				className={`main-content ${clips.length === 0 ? "main-content--empty" : ""}`}
			>
				{clips.length === 0 ? (
					<div className="empty-state">
						<div className="empty-icon" aria-hidden>
							<svg viewBox="0 0 48 48" fill="none">
								<path
									d="M14 24h6l3-8 4 16 3-8h6"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</div>
						<h2 className="empty-title">Add your first sound</h2>
						<p className="empty-desc">
							Drop files here or import from disk. Assign hotkeys after importing.
						</p>
						<button
							type="button"
							className="btn-primary btn-lg"
							onClick={() => void getRpc().request.importViaDialog({}).then(applyState)}
						>
							Import sounds
						</button>
						<p className="empty-formats">MP3 · WAV · OGG · M4A</p>
					</div>
				) : (
					<div className="clip-grid">
						{clips.map((clip) => (
							<ClipPad
								key={clip.id}
								clip={clip}
								progress={playback.progress[clip.id] ?? 0}
								isPlaying={playback.playing[clip.id] ?? false}
								onPlay={() => void playClip(clip)}
								onStop={() => audioEngine.stopClip(clip.id)}
								onEdit={() => setEditClip(clip)}
								onEditHotkey={() => setHotkeyClip(clip)}
								onVolumePreview={(v) => audioEngine.setClipVolume(clip.id, v)}
								onVolumeCommit={(v) =>
									void getRpc().request
										.setClipVolume({ id: clip.id, volume: v })
										.then(applyState)
								}
								reorderState={{
									dragging: dragId === clip.id,
									dragOver: dragOverId === clip.id,
								}}
								onReorderPointerDown={(e) => {
									reorderStartRef.current = {
										id: clip.id,
										x: e.clientX,
										y: e.clientY,
									};
								}}
							/>
						))}
					</div>
				)}
			</main>

			{editClip && (
				<EditClipModal
					clip={editClip}
					onClose={() => setEditClip(null)}
					onSave={(name) =>
						void getRpc().request
							.renameClip({ id: editClip.id, displayName: name })
							.then((s) => {
								applyState(s);
								setEditClip(null);
							})
					}
					onDelete={() =>
						void getRpc().request.deleteClip({ id: editClip.id }).then((s) => {
							audioEngine.removeClip(editClip.id);
							applyState(s);
							setEditClip(null);
						})
					}
				/>
			)}

			{hotkeyClip && (
				<HotkeyModal
					clip={hotkeyClip}
					onClose={() => setHotkeyClip(null)}
					onSave={async (hotkey) => {
						const result = await getRpc().request.setClipHotkey({
							id: hotkeyClip.id,
							hotkey,
						});
						if (!result.ok) {
							showToast(result.error ?? "Hotkey conflict", "error");
							return;
						}
						await applyState(result.state);
						setHotkeyClip(null);
						showToast(hotkey ? "Shortcut saved" : "Shortcut removed");
					}}
				/>
			)}

			{toast && (
				<Toast
					message={toast.message}
					variant={toast.variant}
					onDismiss={() => setToast(null)}
				/>
			)}
		</div>
	);
}

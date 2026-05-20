import type { Clip } from "@shared/types";
import { useEffect, useState } from "react";
import {
	eventToAccelerator,
	formatHotkeyPart,
	getAcceleratorParts,
} from "../utils/hotkey";

type Props = {
	clip: Clip;
	onSave: (hotkey: string) => void | Promise<void>;
	onClose: () => void;
};

function HotkeyKeyDisplay({
	parts,
	placeholder,
}: {
	parts: string[];
	placeholder: string;
}) {
	if (parts.length === 0) {
		return <span className="hotkey-preview-placeholder">{placeholder}</span>;
	}
	return (
		<div className="hotkey-keys">
			{parts.map((part, i) => (
				<kbd key={`${part}-${i}`} className="hotkey-key">
					{formatHotkeyPart(part)}
				</kbd>
			))}
		</div>
	);
}

export function HotkeyModal({ clip, onSave, onClose }: Props) {
	const [recording, setRecording] = useState(false);
	const [saving, setSaving] = useState(false);
	const [draft, setDraft] = useState(clip.hotkey);
	const [liveParts, setLiveParts] = useState<string[]>([]);

	useEffect(() => {
		setDraft(clip.hotkey);
		setRecording(false);
		setLiveParts([]);
		setSaving(false);
	}, [clip.id, clip.hotkey]);

	useEffect(() => {
		if (!recording) return;

		const onKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (e.key === "Escape") {
				setRecording(false);
				setLiveParts([]);
				return;
			}

			const accel = eventToAccelerator(e);
			if (!accel) {
				const parts: string[] = [];
				if (e.metaKey || e.ctrlKey) parts.push("CommandOrControl");
				if (e.altKey) parts.push("Alt");
				if (e.shiftKey) parts.push("Shift");
				setLiveParts(parts);
				return;
			}

			setDraft(accel);
			setLiveParts([]);
			setRecording(false);
		};

		window.addEventListener("keydown", onKeyDown, true);
		return () => window.removeEventListener("keydown", onKeyDown, true);
	}, [recording]);

	const isDirty = draft !== clip.hotkey;
	const canSave = isDirty && !recording && !saving;
	const previewParts = recording ? liveParts : getAcceleratorParts(draft);
	const previewPlaceholder = recording
		? "Press key combination…"
		: "No shortcut";

	const handleSave = () => {
		if (!canSave) return;
		setSaving(true);
		void Promise.resolve(onSave(draft)).finally(() => setSaving(false));
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="glass-panel modal-sheet hotkey-modal"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="modal-title">Shortcut for {clip.displayName}</h2>
				<p className="modal-body hotkey-modal-desc">
					Plays this sound globally, even when the app is in the background.
				</p>

				<div
					className={`hotkey-preview ${recording ? "hotkey-preview--recording" : ""}`}
				>
					<HotkeyKeyDisplay
						parts={previewParts}
						placeholder={previewPlaceholder}
					/>
				</div>

				<p className="modal-hint">
					{recording
						? "Press Escape to cancel recording."
						: isDirty
							? "Unsaved changes — save to apply."
							: "Record a shortcut, then save when ready."}
				</p>

				<div className="hotkey-modal-controls">
					<button
						type="button"
						className="btn-secondary"
						onClick={() => {
							setRecording(true);
							setLiveParts([]);
						}}
						disabled={recording || saving}
					>
						{recording
							? "Listening…"
							: draft
								? "Record new shortcut"
								: "Record shortcut"}
					</button>

					<div className="hotkey-modal-actions">
						<button
							type="button"
							className="btn-ghost"
							onClick={onClose}
							disabled={saving}
						>
							Cancel
						</button>
						<button
							type="button"
							className="btn-primary"
							onClick={handleSave}
							disabled={!canSave}
						>
							{saving ? "Saving…" : "Save"}
						</button>
					</div>

					{(clip.hotkey || draft) && (
						<button
							type="button"
							className="hotkey-modal-remove"
							onClick={() => setDraft("")}
							disabled={recording || saving}
						>
							Remove shortcut
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

import type { Clip } from "@shared/types";
import { useState } from "react";
import {
	previewParts,
	useHotkeyRecording,
} from "../hooks/useHotkeyRecording";
import { formatHotkeyPart } from "../utils/hotkey";

export type HotkeyModalProps = {
	clip: Clip;
	onSave: (hotkey: string) => void | Promise<void>;
	onClose: () => void;
};

export function HotkeyModal({ clip, onSave, onClose }: HotkeyModalProps) {
	const [recording, setRecording] = useState(false);
	const [saving, setSaving] = useState(false);
	const [draft, setDraft] = useState(clip.hotkey);

	const onCaptured = (accel: string) => {
		setDraft(accel);
		setRecording(false);
	};

	const { liveParts, clearLiveParts } = useHotkeyRecording(recording, onCaptured);

	return (
		<HotkeyModalSheet
			clip={clip}
			draft={draft}
			recording={recording}
			saving={saving}
			liveParts={liveParts}
			onClose={onClose}
			onDraftChange={setDraft}
			onStartRecording={() => {
				setRecording(true);
				clearLiveParts();
			}}
			onSave={(hotkey) => {
				setSaving(true);
				void Promise.resolve(onSave(hotkey)).finally(() => setSaving(false));
			}}
		/>
	);
}

function HotkeyModalSheet(props: HotkeyModalSheetProps) {
	return (
		<div className="modal-overlay" onClick={props.onClose}>
			<div
				className="glass-panel modal-sheet hotkey-modal"
				onClick={(e) => e.stopPropagation()}
			>
				<HotkeyModalBody {...props} />
			</div>
		</div>
	);
}

type HotkeyModalSheetProps = {
	clip: Clip;
	draft: string;
	recording: boolean;
	saving: boolean;
	liveParts: string[];
	onClose: () => void;
	onDraftChange: (hotkey: string) => void;
	onStartRecording: () => void;
	onSave: (hotkey: string) => void;
};

function HotkeyModalBody(props: HotkeyModalSheetProps) {
	const isDirty = props.draft !== props.clip.hotkey;
	const canSave = isDirty && !props.recording && !props.saving;
	const preview = previewParts(props.recording, props.liveParts, props.draft);

	return (
		<>
			<h2 className="modal-title">Shortcut for {props.clip.displayName}</h2>
			<p className="modal-body hotkey-modal-desc">
				Plays this sound globally, even when the app is in the background.
			</p>
			<HotkeyPreview recording={props.recording} parts={preview} />
			<p className="modal-hint">{hotkeyModalHint(props.recording, isDirty)}</p>
			<HotkeyModalControls
				clip={props.clip}
				draft={props.draft}
				recording={props.recording}
				saving={props.saving}
				canSave={canSave}
				onClose={props.onClose}
				onDraftChange={props.onDraftChange}
				onStartRecording={props.onStartRecording}
				onSave={() => {
					if (!canSave) return;
					props.onSave(props.draft);
				}}
			/>
		</>
	);
}

function HotkeyPreview({
	recording,
	parts,
}: {
	recording: boolean;
	parts: string[];
}) {
	const className = recording
		? "hotkey-preview hotkey-preview--recording"
		: "hotkey-preview";
	const placeholder = recording ? "Press key combination…" : "No shortcut";
	return (
		<div className={className}>
			<HotkeyKeyDisplay parts={parts} placeholder={placeholder} />
		</div>
	);
}

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

function hotkeyModalHint(recording: boolean, isDirty: boolean): string {
	if (recording) return "Press Escape to cancel recording.";
	if (isDirty) return "Unsaved changes — save to apply.";
	return "Record a shortcut, then save when ready.";
}

function hotkeyRecordLabel(recording: boolean, draft: string): string {
	if (recording) return "Listening…";
	if (draft) return "Record new shortcut";
	return "Record shortcut";
}

function HotkeyModalControls(props: {
	clip: Clip;
	draft: string;
	recording: boolean;
	saving: boolean;
	canSave: boolean;
	onClose: () => void;
	onDraftChange: (hotkey: string) => void;
	onStartRecording: () => void;
	onSave: () => void;
}) {
	return (
		<div className="hotkey-modal-controls">
			<HotkeyRecordButton {...props} />
			<HotkeyActionButtons {...props} />
			<HotkeyRemoveButton {...props} />
		</div>
	);
}

function HotkeyRecordButton({
	recording,
	saving,
	draft,
	onStartRecording,
}: {
	recording: boolean;
	saving: boolean;
	draft: string;
	onStartRecording: () => void;
}) {
	return (
		<button
			type="button"
			className="btn-secondary"
			onClick={onStartRecording}
			disabled={recording || saving}
		>
			{hotkeyRecordLabel(recording, draft)}
		</button>
	);
}

function HotkeyActionButtons({
	saving,
	canSave,
	onClose,
	onSave,
}: {
	saving: boolean;
	canSave: boolean;
	onClose: () => void;
	onSave: () => void;
}) {
	return (
		<div className="hotkey-modal-actions">
			<button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
				Cancel
			</button>
			<button
				type="button"
				className="btn-primary"
				onClick={onSave}
				disabled={!canSave}
			>
				{saving ? "Saving…" : "Save"}
			</button>
		</div>
	);
}

function HotkeyRemoveButton({
	clip,
	draft,
	recording,
	saving,
	onDraftChange,
}: {
	clip: Clip;
	draft: string;
	recording: boolean;
	saving: boolean;
	onDraftChange: (hotkey: string) => void;
}) {
	if (!shouldShowHotkeyRemove(clip.hotkey, draft)) return null;
	return (
		<button
			type="button"
			className="hotkey-modal-remove"
			onClick={() => onDraftChange("")}
			disabled={recording || saving}
		>
			Remove shortcut
		</button>
	);
}

function shouldShowHotkeyRemove(clipHotkey: string, draft: string): boolean {
	if (clipHotkey) return true;
	return Boolean(draft);
}

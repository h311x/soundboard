import type { Clip } from "@shared/types";
import { useState } from "react";
import {
	previewParts,
	useHotkeyRecording,
} from "../hooks/useHotkeyRecording";
import { formatHotkeyPart } from "../utils/hotkey";
import { cn } from "../utils/cn";
import { Button } from "./ui/Button";
import { ModalBody, ModalHint, ModalOverlay, ModalSheet, ModalTitle } from "./ui/Modal";

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
		<ModalOverlay onClose={props.onClose}>
			<ModalSheet onClick={(e) => e.stopPropagation()}>
				<HotkeyModalBody {...props} />
			</ModalSheet>
		</ModalOverlay>
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
			<ModalTitle>Shortcut for {props.clip.displayName}</ModalTitle>
			<ModalBody className="mb-3">
				Plays this sound globally, even when the app is in the background.
			</ModalBody>
			<HotkeyPreview recording={props.recording} parts={preview} />
			<ModalHint>{hotkeyModalHint(props.recording, isDirty)}</ModalHint>
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
	const placeholder = recording ? "Press key combination…" : "No shortcut";
	return (
		<div
			className={cn(
				"mb-3 flex min-h-[4.5rem] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-black/25 px-4 py-5",
				recording &&
					"border-[var(--accent-focus)] shadow-[0_0_0_1px_hsl(var(--accent-hsl)/0.2)]",
			)}
		>
			<HotkeyKeyDisplay parts={parts} placeholder={placeholder} recording={recording} />
		</div>
	);
}

function HotkeyKeyDisplay({
	parts,
	placeholder,
	recording,
}: {
	parts: string[];
	placeholder: string;
	recording: boolean;
}) {
	if (parts.length === 0) {
		return (
			<span className="text-center text-[0.95rem] text-[var(--text-muted)]">
				{placeholder}
			</span>
		);
	}
	return (
		<div className="flex flex-wrap items-center justify-center gap-2.5">
			{parts.map((part, i) => (
				<kbd
					key={`${part}-${i}`}
					className={cn(
						"inline-flex min-h-10 min-w-10 items-center justify-center rounded-[10px] border border-white/[0.14] bg-white/[0.08] px-3 font-mono text-[1.15rem] leading-none text-[var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
						recording &&
							"border-[hsl(var(--accent-hsl)/0.45)] bg-[hsl(var(--accent-hsl)/0.12)] text-[hsl(var(--accent-hsl)/0.95)]",
					)}
				>
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
		<div className="mt-1 flex flex-col gap-2.5">
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
		<Button
			variant="secondary"
			className="w-full"
			onClick={onStartRecording}
			disabled={recording || saving}
		>
			{hotkeyRecordLabel(recording, draft)}
		</Button>
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
		<div className="grid grid-cols-2 gap-2.5">
			<Button variant="ghost" className="w-full justify-center" onClick={onClose} disabled={saving}>
				Cancel
			</Button>
			<Button className="w-full justify-center" onClick={onSave} disabled={!canSave}>
				{saving ? "Saving…" : "Save"}
			</Button>
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
			className="mt-0.5 w-full cursor-pointer rounded-[var(--radius-sm)] border-none bg-transparent px-3 py-2 font-inherit text-[0.82rem] text-[#e88] transition-[color,background] duration-150 hover:bg-[rgba(200,80,80,0.12)] hover:text-[#faa] disabled:cursor-not-allowed disabled:opacity-[0.38]"
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

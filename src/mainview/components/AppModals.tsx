import type { AppState, Clip } from "@shared/types";
import { audioEngine } from "../audio/engine";
import { saveClipHotkey } from "../app/saveHotkey";
import { getRpc } from "../rpc";
import { EditClipModal } from "./EditClipModal";
import { HotkeyModal } from "./HotkeyModal";

export type AppModalsProps = {
	editClip: Clip | null;
	hotkeyClip: Clip | null;
	applyState: (s: AppState) => Promise<void>;
	showToast: (message: string, variant?: "info" | "error") => void;
	onCloseEdit: () => void;
	onCloseHotkey: () => void;
};

export function AppModals({
	editClip,
	hotkeyClip,
	applyState,
	showToast,
	onCloseEdit,
	onCloseHotkey,
}: AppModalsProps) {
	return (
		<>
			{editClip && (
				<EditClipModal
					key={editClip.id}
					clip={editClip}
					onClose={onCloseEdit}
					onSave={(name) => void renameClip(editClip, name, applyState, onCloseEdit)}
					onDelete={() => void deleteClip(editClip, applyState, onCloseEdit)}
				/>
			)}
			{hotkeyClip && (
				<HotkeyModal
					key={hotkeyClip.id}
					clip={hotkeyClip}
					onClose={onCloseHotkey}
					onSave={(hotkey) =>
						void saveClipHotkey(hotkeyClip.id, hotkey, applyState, showToast).then(
							(ok) => {
								if (ok) onCloseHotkey();
							},
						)
					}
				/>
			)}
		</>
	);
}

async function renameClip(
	clip: Clip,
	name: string,
	applyState: (s: AppState) => Promise<void>,
	onClose: () => void,
): Promise<void> {
	const s = await getRpc().request.renameClip({
		id: clip.id,
		displayName: name,
	});
	await applyState(s);
	onClose();
}

async function deleteClip(
	clip: Clip,
	applyState: (s: AppState) => Promise<void>,
	onClose: () => void,
): Promise<void> {
	const s = await getRpc().request.deleteClip({ id: clip.id });
	audioEngine.removeClip(clip.id);
	await applyState(s);
	onClose();
}

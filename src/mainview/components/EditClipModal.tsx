import type { Clip } from "@shared/types";
import { useState } from "react";

export type EditClipModalProps = {
	clip: Clip;
	onSave: (name: string) => void;
	onDelete: () => void;
	onClose: () => void;
};

export function EditClipModal({ clip, onSave, onDelete, onClose }: EditClipModalProps) {
	const [value, setValue] = useState(clip.displayName);
	const [confirmDelete, setConfirmDelete] = useState(false);

	if (confirmDelete) {
		return (
			<div className="modal-overlay" onClick={onClose}>
				<div
					className="glass-panel modal-sheet"
					onClick={(e) => e.stopPropagation()}
				>
					<h2 className="modal-title">Delete sound?</h2>
					<p className="modal-body">
						Remove <strong>{clip.displayName}</strong> from your board. This
						cannot be undone.
					</p>
					<div className="modal-actions">
						<button
							type="button"
							className="btn-ghost"
							onClick={() => setConfirmDelete(false)}
						>
							Back
						</button>
						<button type="button" className="btn-danger" onClick={onDelete}>
							Delete
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="glass-panel modal-sheet"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="modal-title">Edit sound</h2>
				<label className="modal-label" htmlFor="clip-edit-name">
					Name
				</label>
				<input
					id="clip-edit-name"
					className="glass-input"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") onSave(value.trim());
						if (e.key === "Escape") onClose();
					}}
					autoFocus
				/>
				<div className="modal-actions">
					<button type="button" className="btn-ghost" onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className="btn-primary"
						onClick={() => onSave(value.trim())}
						disabled={!value.trim()}
					>
						Save
					</button>
				</div>

				<div className="modal-divider" />

				<p className="modal-body modal-body--compact">
					Remove this sound from your board.
				</p>
				<button
					type="button"
					className="btn-danger btn-danger--full"
					onClick={() => setConfirmDelete(true)}
				>
					Delete sound…
				</button>
			</div>
		</div>
	);
}

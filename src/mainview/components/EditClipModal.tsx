import type { Clip } from "@shared/types";
import { useState } from "react";
import { Button } from "./ui/Button";
import { GlassInput } from "./ui/GlassInput";
import {
	ModalActions,
	ModalBody,
	ModalDivider,
	ModalLabel,
	ModalOverlay,
	ModalSheet,
	ModalTitle,
} from "./ui/Modal";

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
			<ModalOverlay onClose={onClose}>
				<ModalSheet onClick={(e) => e.stopPropagation()}>
					<ModalTitle>Delete sound?</ModalTitle>
					<ModalBody>
						Remove <strong>{clip.displayName}</strong> from your board. This
						cannot be undone.
					</ModalBody>
					<ModalActions>
						<Button variant="ghost" onClick={() => setConfirmDelete(false)}>
							Back
						</Button>
						<Button variant="danger" onClick={onDelete}>
							Delete
						</Button>
					</ModalActions>
				</ModalSheet>
			</ModalOverlay>
		);
	}

	return (
		<ModalOverlay onClose={onClose}>
			<ModalSheet onClick={(e) => e.stopPropagation()}>
				<ModalTitle>Edit sound</ModalTitle>
				<ModalLabel htmlFor="clip-edit-name">Name</ModalLabel>
				<GlassInput
					id="clip-edit-name"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") onSave(value.trim());
						if (e.key === "Escape") onClose();
					}}
					autoFocus
				/>
				<ModalActions>
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={() => onSave(value.trim())} disabled={!value.trim()}>
						Save
					</Button>
				</ModalActions>

				<ModalDivider />

				<ModalBody compact>Remove this sound from your board.</ModalBody>
				<Button
					variant="danger"
					className="w-full"
					onClick={() => setConfirmDelete(true)}
				>
					Delete sound…
				</Button>
			</ModalSheet>
		</ModalOverlay>
	);
}

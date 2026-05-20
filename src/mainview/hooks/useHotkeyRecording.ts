import { useEffect, useState } from "react";
import { eventToAccelerator, getAcceleratorParts } from "../utils/hotkey";
import { modifierPartsFromEvent } from "../utils/hotkey-modifiers";

export function useHotkeyRecording(
	recording: boolean,
	onCaptured: (accelerator: string) => void,
) {
	const [liveParts, setLiveParts] = useState<string[]>([]);

	useEffect(() => {
		if (!recording) return;
		const onKeyDown = createRecordingKeyHandler(onCaptured, setLiveParts);
		window.addEventListener("keydown", onKeyDown, true);
		return () => window.removeEventListener("keydown", onKeyDown, true);
	}, [recording, onCaptured]);

	return {
		liveParts,
		clearLiveParts: () => setLiveParts([]),
	};
}

function createRecordingKeyHandler(
	onCaptured: (accelerator: string) => void,
	setLiveParts: (parts: string[]) => void,
) {
	return (e: KeyboardEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (e.key === "Escape") {
			setLiveParts([]);
			return;
		}

		const accel = eventToAccelerator(e);
		if (!accel) {
			setLiveParts(modifierPartsFromEvent(e));
			return;
		}

		onCaptured(accel);
		setLiveParts([]);
	};
}

export function previewParts(
	recording: boolean,
	liveParts: string[],
	draft: string,
): string[] {
	if (recording) return liveParts;
	return getAcceleratorParts(draft);
}

import type { AppState } from "@shared/types";
import { getRpc } from "../rpc";

export function allowFileDrop(e: React.DragEvent): void {
	if (!e.dataTransfer.types.includes("Files")) return;
	e.preventDefault();
	e.dataTransfer.dropEffect = "copy";
}

export async function importDroppedFiles(
	files: File[],
	applyState: (s: AppState) => Promise<void>,
	showToast: (message: string, variant?: "info" | "error") => void,
): Promise<void> {
	const payloads = await readFilePayloads(files);
	if (!payloads.length) return;

	try {
		const s = await getRpc().request.importFileData({ files: payloads });
		await applyState(s);
		showToast(`Imported ${payloads.length} sound(s)`);
	} catch (err) {
		console.error(err);
		showToast("Import failed", "error");
	}
}

async function readFilePayloads(
	files: File[],
): Promise<{ name: string; data: number[] }[]> {
	const payloads: { name: string; data: number[] }[] = [];
	for (const file of files) {
		const buf = await file.arrayBuffer();
		payloads.push({
			name: file.name,
			data: Array.from(new Uint8Array(buf)),
		});
	}
	return payloads;
}

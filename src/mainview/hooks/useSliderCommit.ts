import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

/** Local slider value while dragging; persist only on commit. */
export function useSliderCommit(
	value: number,
	onPreview: (v: number) => void,
	onCommit: (v: number) => void,
) {
	const [local, setLocal] = useState<number | null>(null);
	const draggingRef = useRef(false);
	const display = local ?? value;

	// Clear local only after persisted value catches up (avoids thumb jumping on commit).
	useEffect(() => {
		if (draggingRef.current || local === null) return;
		if (Math.abs(value - local) < 0.005) setLocal(null);
	}, [value, local]);

	const onInput = useCallback(
		(next: number) => {
			draggingRef.current = true;
			setLocal(next);
			onPreview(next);
		},
		[onPreview],
	);

	const commit = useCallback(() => {
		draggingRef.current = false;
		if (local === null) return;
		onCommit(local);
	}, [local, onCommit]);

	/** Stop Electrobun window-drag from stealing pointer events (Windows toolbar). */
	const onPointerDown = useCallback((e: PointerEvent) => {
		e.stopPropagation();
	}, []);

	return { display, onInput, commit, onPointerDown };
}

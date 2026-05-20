import { useCallback, useRef, useState, type PointerEvent } from "react";

/** Local slider value while dragging; persist only on commit. */
export function useSliderCommit(
	value: number,
	onPreview: (v: number) => void,
	onCommit: (v: number) => void,
) {
	const [local, setLocal] = useState<number | null>(null);
	const draggingRef = useRef(false);
	const display = local ?? value;

	const onInput = useCallback(
		(next: number) => {
			if (local !== null && Math.abs(value - local) < 0.005) {
				setLocal(null);
			}
			draggingRef.current = true;
			setLocal(next);
			onPreview(next);
		},
		[local, onPreview, value],
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

export type SliderCommit = ReturnType<typeof useSliderCommit>;

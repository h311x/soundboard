import { useCallback, useState, type PointerEvent } from "react";

/** Local slider value while dragging; persist only on commit. */
export function useSliderCommit(
	value: number,
	onPreview: (v: number) => void,
	onCommit: (v: number) => void,
) {
	const [local, setLocal] = useState<number | null>(null);
	const [dragging, setDragging] = useState(false);
	const display = sliderDisplay(value, local, dragging);

	const onInput = useCallback(
		(next: number) => {
			setDragging(true);
			setLocal(next);
			onPreview(next);
		},
		[onPreview],
	);

	const commit = useCallback(() => {
		setDragging(false);
		if (local === null) return;
		onCommit(local);
	}, [local, onCommit]);

	/** Stop Electrobun window-drag from stealing pointer events (Windows toolbar). */
	const onPointerDown = useCallback((e: PointerEvent) => {
		e.stopPropagation();
	}, []);

	return { display, onInput, commit, onPointerDown };
}

export function sliderDisplay(
	value: number,
	local: number | null,
	dragging: boolean,
): number {
	if (local === null) return value;
	if (dragging || !volumesClose(value, local)) return local;
	return value;
}

export function volumesClose(a: number, b: number): boolean {
	return Math.abs(a - b) < 0.005;
}

export type SliderCommit = ReturnType<typeof useSliderCommit>;

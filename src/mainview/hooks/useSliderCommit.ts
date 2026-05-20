import { useCallback, useEffect, useState } from "react";

/** Local slider value while dragging; persist only on commit. */
export function useSliderCommit(
	value: number,
	onPreview: (v: number) => void,
	onCommit: (v: number) => void,
) {
	const [local, setLocal] = useState<number | null>(null);
	const display = local ?? value;

	useEffect(() => {
		setLocal(null);
	}, [value]);

	const onInput = useCallback(
		(next: number) => {
			setLocal(next);
			onPreview(next);
		},
		[onPreview],
	);

	const commit = useCallback(() => {
		if (local === null) return;
		onCommit(local);
		setLocal(null);
	}, [local, onCommit]);

	return { display, onInput, commit };
}

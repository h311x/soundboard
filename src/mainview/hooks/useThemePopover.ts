import { useCallback, useEffect, useRef, useState } from "react";

export function useThemePopover(
	showThemePicker: boolean,
	onCloseTheme: () => void,
) {
	const themeAnchorRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);

	const closeThemePicker = useCallback(() => {
		setPopoverRect(null);
		onCloseTheme();
	}, [onCloseTheme]);

	useEffect(() => {
		if (!showThemePicker) return;
		const onPointerDown = createOutsideClickHandler(
			popoverRef,
			themeAnchorRef,
			closeThemePicker,
		);
		window.addEventListener("pointerdown", onPointerDown);
		return () => window.removeEventListener("pointerdown", onPointerDown);
	}, [showThemePicker, closeThemePicker]);

	const openThemePicker = () => {
		const rect = themeAnchorRef.current?.getBoundingClientRect();
		if (rect) setPopoverRect(rect);
	};

	return {
		themeAnchorRef,
		popoverRef,
		popoverRect,
		closeThemePicker,
		openThemePicker,
	};
}

function createOutsideClickHandler(
	popoverRef: React.RefObject<HTMLDivElement | null>,
	anchorRef: React.RefObject<HTMLButtonElement | null>,
	onClose: () => void,
): (e: PointerEvent) => void {
	return (e: PointerEvent) => {
		const target = e.target as Node;
		if (popoverRef.current?.contains(target)) return;
		if (anchorRef.current?.contains(target)) return;
		onClose();
	};
}

export function getPopoverPosition(rect: DOMRect) {
	return {
		position: "fixed" as const,
		top: rect.bottom + 8,
		right: Math.max(12, window.innerWidth - rect.right),
		zIndex: 10000,
	};
}

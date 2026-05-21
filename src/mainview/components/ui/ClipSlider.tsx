import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type ClipSliderProps = InputHTMLAttributes<HTMLInputElement>;

export function ClipSlider({ className, ...props }: ClipSliderProps) {
	return (
		<input
			type="range"
			className={cn("clip-slider", className)}
			{...props}
		/>
	);
}

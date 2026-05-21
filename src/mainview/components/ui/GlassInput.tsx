import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type GlassInputProps = InputHTMLAttributes<HTMLInputElement>;

export function GlassInput({ className, ...props }: GlassInputProps) {
	return (
		<input
			className={cn(
				"glass-input mb-4 w-full rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-black/25 px-3 py-2.5 font-inherit text-[var(--text-primary)] focus:outline-2 focus:outline-offset-2 focus:outline-[var(--accent)]",
				className,
			)}
			{...props}
		/>
	);
}

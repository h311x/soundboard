import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
	function GlassPanel({ className, ...props }, ref) {
		return (
			<div
				ref={ref}
				className={cn(
					"relative z-[1] border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--shadow-glass)] backdrop-blur-[var(--glass-blur)] backdrop-saturate-[1.4]",
					className,
				)}
				{...props}
			/>
		);
	},
);

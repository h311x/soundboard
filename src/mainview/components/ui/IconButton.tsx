import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	active?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
	function IconButton({ active, className, type = "button", ...props }, ref) {
		return (
			<button
				ref={ref}
				type={type}
				className={cn(
					"inline-flex size-8 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-white/[0.05] p-0 text-[0.85rem] text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)] hover:border-[var(--glass-highlight)]",
					active &&
						"border-[var(--accent-focus)] bg-[hsl(var(--accent-hsl)/0.15)]",
					className,
				)}
				{...props}
			/>
		);
	},
);

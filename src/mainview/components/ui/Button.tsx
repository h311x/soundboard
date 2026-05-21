import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "default" | "lg";

const base =
	"inline-flex items-center justify-center font-inherit text-[0.85rem] px-3.5 py-2 rounded-[var(--radius-sm)] cursor-pointer border transition-[background,border-color,transform] duration-150 ease-out disabled:opacity-[0.38] disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
	primary:
		"bg-[hsl(var(--accent-hsl)/0.25)] border-[hsl(var(--accent-hsl)/0.5)] text-[var(--text-primary)] hover:bg-[hsl(var(--accent-hsl)/0.38)] hover:border-[var(--accent-focus)] active:scale-[0.98] disabled:hover:bg-[hsl(var(--accent-hsl)/0.1)] disabled:hover:border-[hsl(var(--accent-hsl)/0.18)] disabled:text-[var(--text-muted)]",
	secondary:
		"bg-white/[0.06] border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-white/10 hover:border-[var(--glass-highlight)]",
	ghost:
		"bg-transparent border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
	danger:
		"bg-[rgba(220,80,80,0.15)] border-[rgba(220,80,80,0.4)] text-[#f0a0a0] hover:bg-[rgba(220,80,80,0.22)]",
};

const sizes: Record<ButtonSize, string> = {
	default: "",
	lg: "px-6 py-3 text-[0.95rem] font-semibold",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
};

export function Button({
	variant = "primary",
	size = "default",
	className,
	type = "button",
	...props
}: ButtonProps) {
	return (
		<button
			type={type}
			className={cn(base, variants[variant], sizes[size], className)}
			{...props}
		/>
	);
}

import { cn } from "../utils/cn";

export type ToastProps = {
	message: string;
	variant?: "info" | "error";
	onDismiss: () => void;
};

export function Toast({ message, variant = "info", onDismiss }: ToastProps) {
	return (
		<div
			className={cn(
				"fixed bottom-5 left-1/2 z-[200] max-w-[90%] -translate-x-1/2 cursor-pointer rounded-[var(--radius-sm)] px-5 py-3 text-[0.85rem]",
				variant === "info" &&
					"border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] backdrop-blur-[20px]",
				variant === "error" &&
					"border border-[rgba(220,100,100,0.5)] bg-[rgba(120,40,40,0.9)] text-white",
			)}
			role="status"
			onClick={onDismiss}
		>
			{message}
		</div>
	);
}

type Props = {
	message: string;
	variant?: "info" | "error";
	onDismiss: () => void;
};

export function Toast({ message, variant = "info", onDismiss }: Props) {
	return (
		<div
			className={`toast toast-${variant}`}
			role="status"
			onClick={onDismiss}
		>
			{message}
		</div>
	);
}

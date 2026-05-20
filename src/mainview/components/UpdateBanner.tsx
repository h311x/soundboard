type Props = {
	version?: string;
	ready: boolean;
	downloading: boolean;
	onDownload: () => void;
	onApply: () => void;
	onDismiss: () => void;
};

export function UpdateBanner({
	version,
	ready,
	downloading,
	onDownload,
	onApply,
	onDismiss,
}: Props) {
	return (
		<div className="update-banner glass-panel">
			<span>
				{ready
					? "Update ready — restart to apply"
					: `Update ${version ?? ""} available`.trim()}
			</span>
			<div className="update-actions">
				{ready ? (
					<button type="button" className="btn-primary" onClick={onApply}>
						Restart
					</button>
				) : (
					<button
						type="button"
						className="btn-primary"
						onClick={onDownload}
						disabled={downloading}
					>
						{downloading ? "Downloading…" : "Download"}
					</button>
				)}
				<button type="button" className="btn-ghost" onClick={onDismiss}>
					Dismiss
				</button>
			</div>
		</div>
	);
}

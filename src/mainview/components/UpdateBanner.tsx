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
	const versionLabel = version?.replace(/^v/i, "") ?? "";

	let title: string;
	let description: string;
	if (ready) {
		title = "Ready to install";
		description = "Restart Soundboard to finish updating.";
	} else if (downloading) {
		title = "Downloading update";
		description = versionLabel
			? `Version ${versionLabel} is on its way.`
			: "Hang tight — this usually takes a moment.";
	} else {
		title = "Update available";
		description = versionLabel
			? `Version ${versionLabel} is ready for your soundboard.`
			: "A newer version is available.";
	}

	return (
		<section
			className={`update-banner ${ready ? "update-banner--ready" : ""} ${downloading ? "update-banner--downloading" : ""}`}
			role="status"
			aria-live="polite"
			aria-labelledby="update-banner-title"
		>
			<div className="update-banner__glow" aria-hidden />

			<div className="update-banner__icon" aria-hidden>
				{ready ? <IconCheck /> : downloading ? <IconDownload /> : <IconSpark />}
			</div>

			<div className="update-banner__body">
				<div className="update-banner__headline">
					<h2 id="update-banner-title" className="update-banner__title">
						{title}
					</h2>
					{versionLabel && !downloading && (
						<span className="update-banner__version">v{versionLabel}</span>
					)}
				</div>
				<p className="update-banner__desc">{description}</p>
				{downloading && (
					<div className="update-banner__progress" aria-hidden>
						<span className="update-banner__progress-bar" />
					</div>
				)}
			</div>

			<div className="update-banner__actions">
				{ready ? (
					<button type="button" className="btn-primary" onClick={onApply}>
						Restart now
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
				<button
					type="button"
					className="btn-ghost update-banner__later"
					onClick={onDismiss}
					disabled={downloading}
				>
					{ready ? "Later" : "Not now"}
				</button>
			</div>

			<button
				type="button"
				className="update-banner__close"
				onClick={onDismiss}
				disabled={downloading}
				aria-label="Dismiss update"
			>
				<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
					<path
						d="M2 2l8 8M10 2L2 10"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
					/>
				</svg>
			</button>
		</section>
	);
}

function IconSpark() {
	return (
		<svg viewBox="0 0 24 24" width="22" height="22" fill="none">
			<path
				d="M12 2.5l1.4 5.2 5.2 1.4-5.2 1.4L12 15.7l-1.4-5.2-5.2-1.4 5.2-1.4L12 2.5z"
				fill="currentColor"
				opacity="0.9"
			/>
			<path
				d="M19 14l.9 3.1 3.1.9-3.1.9L19 22l-.9-3.1-3.1-.9 3.1-.9L19 14z"
				fill="currentColor"
				opacity="0.55"
			/>
		</svg>
	);
}

function IconDownload() {
	return (
		<svg viewBox="0 0 24 24" width="22" height="22" fill="none">
			<path
				d="M12 4v10m0 0l3.5-3.5M12 14l-3.5-3.5M6 18h12"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function IconCheck() {
	return (
		<svg viewBox="0 0 24 24" width="22" height="22" fill="none">
			<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
			<path
				d="M8 12.2l2.4 2.4 5.6-5.8"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

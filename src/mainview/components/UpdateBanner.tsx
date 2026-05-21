import {
	getUpdateBannerCopy,
	type UpdateBannerPhase,
} from "./update-banner-copy";

export type UpdateBannerProps = {
	version?: string;
	ready: boolean;
	downloading: boolean;
	statusMessage?: string;
	onDownload: () => void;
	onApply: () => void;
	onDismiss: () => void;
};

export function UpdateBanner(props: UpdateBannerProps) {
	const versionLabel = props.version?.replace(/^v/i, "") ?? "";
	const copy = getUpdateBannerCopy(
		props.ready,
		props.downloading,
		versionLabel,
		props.statusMessage,
	);

	return (
		<section
			className={bannerClass(copy.phase, props.downloading)}
			role="status"
			aria-live="polite"
			aria-labelledby="update-banner-title"
		>
			<div className="update-banner__glow" aria-hidden />
			<UpdateBannerIcon phase={copy.phase} />
			<UpdateBannerBody
				title={copy.title}
				description={copy.description}
				versionLabel={versionLabel}
				downloading={props.downloading}
			/>
			<UpdateBannerActions
				ready={props.ready}
				downloading={props.downloading}
				onDownload={props.onDownload}
				onApply={props.onApply}
				onDismiss={props.onDismiss}
			/>
			<UpdateBannerClose
				downloading={props.downloading}
				onDismiss={props.onDismiss}
			/>
		</section>
	);
}

function bannerClass(phase: UpdateBannerPhase, downloading: boolean): string {
	const parts = ["update-banner", "update-banner--animate-in"];
	if (phase === "ready") parts.push("update-banner--ready");
	if (downloading) parts.push("update-banner--downloading");
	return parts.join(" ");
}

function UpdateBannerIcon({ phase }: { phase: UpdateBannerPhase }) {
	return (
		<div className="update-banner__icon" aria-hidden>
			{iconForPhase(phase)}
		</div>
	);
}

function iconForPhase(phase: UpdateBannerPhase) {
	if (phase === "ready") return <IconCheck />;
	if (phase === "downloading") return <IconDownload />;
	return <IconSpark />;
}

function versionBadge(versionLabel: string, downloading: boolean) {
	if (!versionLabel || downloading) return null;
	return <span className="update-banner__version">v{versionLabel}</span>;
}

function UpdateBannerBody({
	title,
	description,
	versionLabel,
	downloading,
}: {
	title: string;
	description: string;
	versionLabel: string;
	downloading: boolean;
}) {
	return (
		<div className="update-banner__body">
			<div className="update-banner__headline">
				<h2 id="update-banner-title" className="update-banner__title">
					{title}
				</h2>
				{versionBadge(versionLabel, downloading)}
			</div>
			<p className="update-banner__desc">{description}</p>
			{downloading && (
				<div className="update-banner__progress" aria-hidden>
					<span className="update-banner__progress-bar" />
				</div>
			)}
		</div>
	);
}

function UpdateBannerActions({
	ready,
	downloading,
	onDownload,
	onApply,
	onDismiss,
}: {
	ready: boolean;
	downloading: boolean;
	onDownload: () => void;
	onApply: () => void;
	onDismiss: () => void;
}) {
	if (ready) {
		return (
			<div className="update-banner__actions">
				<button type="button" className="btn-primary" onClick={onApply}>
					Restart now
				</button>
				<button
					type="button"
					className="btn-ghost update-banner__later"
					onClick={onDismiss}
				>
					Later
				</button>
			</div>
		);
	}

	return (
		<div className="update-banner__actions">
			<button
				type="button"
				className="btn-primary"
				onClick={onDownload}
				disabled={downloading}
			>
				{downloading ? "Downloading…" : "Download"}
			</button>
			<button
				type="button"
				className="btn-ghost update-banner__later"
				onClick={onDismiss}
				disabled={downloading}
			>
				Not now
			</button>
		</div>
	);
}

function UpdateBannerClose({
	downloading,
	onDismiss,
}: {
	downloading: boolean;
	onDismiss: () => void;
}) {
	return (
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

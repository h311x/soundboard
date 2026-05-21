import {
	getUpdateBannerCopy,
	type UpdateBannerPhase,
} from "./update-banner-copy";
import { cn } from "../utils/cn";
import { Button } from "./ui/Button";

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
			className={bannerClass(copy.phase)}
			role="status"
			aria-live="polite"
			aria-labelledby="update-banner-title"
		>
			<div
				className={cn(
					"pointer-events-none absolute -top-[40%] -right-[8%] size-[140px] rounded-full bg-[radial-gradient(circle,hsl(var(--accent-hsl)/0.35)_0%,transparent_70%)]",
					copy.phase === "ready" &&
						"bg-[radial-gradient(circle,hsl(145_50%_45%/0.35)_0%,transparent_70%)]",
				)}
				aria-hidden
			/>
			<UpdateBannerIcon phase={copy.phase} downloading={props.downloading} />
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

function bannerClass(phase: UpdateBannerPhase): string {
	return cn(
		"animate-update-banner-in relative z-[3] mx-4 grid shrink-0 grid-cols-[auto_1fr_auto_auto] items-center gap-x-4 gap-y-3.5 overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--accent-hsl)/0.35)] bg-[linear-gradient(135deg,hsl(var(--accent-hsl)/0.14)_0%,var(--glass-bg)_42%,rgba(255,255,255,0.04)_100%)] px-4 py-3.5 pl-3.5 shadow-[var(--shadow-glass),inset_0_1px_0_hsl(var(--accent-hsl)/0.2)] backdrop-blur-[var(--glass-blur)] backdrop-saturate-[1.35] motion-reduce:animate-none",
		phase === "ready" &&
			"border-[hsl(145_45%_42%/0.45)] bg-[linear-gradient(135deg,hsl(145_40%_28%/0.22)_0%,var(--glass-bg)_50%,rgba(255,255,255,0.04)_100%)]",
	);
}

function UpdateBannerIcon({
	phase,
	downloading,
}: {
	phase: UpdateBannerPhase;
	downloading: boolean;
}) {
	return (
		<div
			className={cn(
				"update-banner-icon flex size-11 items-center justify-center rounded-xl border border-[hsl(var(--accent-hsl)/0.3)] bg-[hsl(var(--accent-hsl)/0.18)] text-[hsl(var(--accent-hsl))] brightness-110 motion-reduce:animate-none",
				phase === "ready" &&
					"border-[hsl(145_45%_50%/0.4)] bg-[hsl(145_40%_32%/0.35)] text-[hsl(145_55%_72%)]",
				downloading && "animate-update-icon-pulse",
			)}
			aria-hidden
		>
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
	return (
		<span className="rounded-full border border-[hsl(var(--accent-hsl)/0.35)] bg-[hsl(var(--accent-hsl)/0.2)] px-2 py-0.5 font-mono text-[0.68rem] font-medium tracking-[0.04em] text-[hsl(var(--accent-hsl))] brightness-120">
			v{versionLabel}
		</span>
	);
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
		<div className="min-w-0">
			<div className="flex flex-wrap items-center gap-2.5">
				<h2
					id="update-banner-title"
					className="m-0 text-[0.95rem] font-semibold leading-snug tracking-[-0.02em]"
				>
					{title}
				</h2>
				{versionBadge(versionLabel, downloading)}
			</div>
			<p className="mt-1 mb-0 text-[0.8rem] leading-snug text-[var(--text-muted)]">
				{description}
			</p>
			{downloading && (
				<div
					className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-white/[0.08]"
					aria-hidden
				>
					<span className="block h-full w-[35%] animate-update-progress rounded-[inherit] bg-[linear-gradient(90deg,hsl(var(--accent-hsl)/0.2),hsl(var(--accent-hsl)/0.9),hsl(var(--accent-hsl)/0.2))] bg-[length:200%_100%] motion-reduce:animate-none" />
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
			<div className="flex shrink-0 items-center gap-2">
				<Button onClick={onApply}>Restart now</Button>
				<Button variant="ghost" className="text-[0.8rem]" onClick={onDismiss}>
					Later
				</Button>
			</div>
		);
	}

	return (
		<div className="flex shrink-0 items-center gap-2">
			<Button onClick={onDownload} disabled={downloading}>
				{downloading ? "Downloading…" : "Download"}
			</Button>
			<Button
				variant="ghost"
				className="text-[0.8rem]"
				onClick={onDismiss}
				disabled={downloading}
			>
				Not now
			</Button>
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
			className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0 text-[var(--text-muted)] transition-[color,background] duration-150 hover:bg-white/[0.08] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-[0.35]"
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

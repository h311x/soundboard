import { Button } from "./ui/Button";

export function EmptyState({ onImport }: { onImport: () => void }) {
	return (
		<div className="relative z-[1] max-w-[380px] px-7 py-8 text-center">
			<div
				className="mb-5 text-[hsl(var(--accent-hsl)/0.7)] [&_svg]:size-14"
				aria-hidden
			>
				<svg viewBox="0 0 48 48" fill="none">
					<path
						d="M14 24h6l3-8 4 16 3-8h6"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</div>
			<h2 className="mb-2 text-[1.25rem] font-semibold tracking-[-0.03em]">
				Add your first sound
			</h2>
			<p className="mb-5 text-[0.88rem] leading-normal text-[var(--text-muted)]">
				Drop files here or import from disk. Assign hotkeys after importing.
			</p>
			<Button size="lg" onClick={onImport}>
				Import sounds
			</Button>
			<p className="!mt-3.5 !text-[0.72rem] font-mono tracking-[0.06em] text-[var(--text-muted)]">
				MP3 · WAV · OGG · M4A
			</p>
		</div>
	);
}

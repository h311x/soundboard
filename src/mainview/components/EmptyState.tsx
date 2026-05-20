export function EmptyState({ onImport }: { onImport: () => void }) {
	return (
		<div className="empty-state">
			<div className="empty-icon" aria-hidden>
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
			<h2 className="empty-title">Add your first sound</h2>
			<p className="empty-desc">
				Drop files here or import from disk. Assign hotkeys after importing.
			</p>
			<button type="button" className="btn-primary btn-lg" onClick={onImport}>
				Import sounds
			</button>
			<p className="empty-formats">MP3 · WAV · OGG · M4A</p>
		</div>
	);
}

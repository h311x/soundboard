import { GlassPanel } from "./ui/GlassPanel";

export function AppLoading() {
	return (
		<div className="select-none-root fixed inset-0 z-[1] flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden">
			<GlassPanel className="px-4 py-3">Loading…</GlassPanel>
		</div>
	);
}

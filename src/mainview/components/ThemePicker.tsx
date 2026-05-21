import type { AccentPresetId } from "@shared/types";
import { ACCENT_PRESETS } from "../theme/presets";
import { cn } from "../utils/cn";

export type ThemePickerProps = {
	value: AccentPresetId;
	onChange: (preset: AccentPresetId) => void;
};

export function ThemePicker({ value, onChange }: ThemePickerProps) {
	return (
		<div
			className="flex flex-wrap gap-2.5 electrobun-webkit-app-region-no-drag"
			role="group"
			aria-label="Accent color"
		>
			{ACCENT_PRESETS.map((preset) => (
				<button
					key={preset.id}
					type="button"
					className={cn(
						"size-7 cursor-pointer rounded-full border-2 border-white/20 transition-[transform,border-color,box-shadow] duration-150 ease-out hover:scale-[1.08] hover:border-[var(--glass-highlight)] electrobun-webkit-app-region-no-drag",
						value === preset.id &&
							"scale-110 border-[var(--accent-focus)] shadow-[0_0_0_2px_hsl(var(--accent-hsl)/0.35)]",
					)}
					style={{ background: preset.swatch }}
					title={preset.label}
					aria-label={preset.label}
					aria-pressed={value === preset.id}
					onPointerDown={(e) => e.stopPropagation()}
					onClick={(e) => {
						e.stopPropagation();
						onChange(preset.id);
					}}
				/>
			))}
		</div>
	);
}

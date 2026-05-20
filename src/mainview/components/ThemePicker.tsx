import type { AccentPresetId } from "@shared/types";
import { ACCENT_PRESETS } from "../theme/presets";

type Props = {
	value: AccentPresetId;
	onChange: (preset: AccentPresetId) => void;
};

export function ThemePicker({ value, onChange }: Props) {
	return (
		<div
			className="theme-picker electrobun-webkit-app-region-no-drag"
			role="group"
			aria-label="Accent color"
		>
			{ACCENT_PRESETS.map((preset) => (
				<button
					key={preset.id}
					type="button"
					className={`theme-swatch electrobun-webkit-app-region-no-drag ${value === preset.id ? "active" : ""}`}
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

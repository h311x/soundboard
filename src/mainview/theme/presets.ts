import type { AccentPresetId } from "@shared/types";

export type AccentPreset = {
	id: AccentPresetId;
	label: string;
	accentHsl: string;
	meshHsl: string;
	swatch: string;
};

export const ACCENT_PRESETS: AccentPreset[] = [
	{
		id: "gray",
		label: "Gray",
		accentHsl: "220 12% 62%",
		meshHsl: "220 14% 14%",
		swatch: "hsl(220 12% 62%)",
	},
	{
		id: "slate",
		label: "Slate",
		accentHsl: "215 16% 58%",
		meshHsl: "215 18% 13%",
		swatch: "hsl(215 16% 58%)",
	},
	{
		id: "violet",
		label: "Violet",
		accentHsl: "270 45% 68%",
		meshHsl: "270 20% 14%",
		swatch: "hsl(270 45% 68%)",
	},
	{
		id: "blue",
		label: "Blue",
		accentHsl: "210 55% 62%",
		meshHsl: "210 22% 14%",
		swatch: "hsl(210 55% 62%)",
	},
	{
		id: "teal",
		label: "Teal",
		accentHsl: "175 40% 55%",
		meshHsl: "175 18% 13%",
		swatch: "hsl(175 40% 55%)",
	},
	{
		id: "amber",
		label: "Amber",
		accentHsl: "38 70% 58%",
		meshHsl: "38 18% 12%",
		swatch: "hsl(38 70% 58%)",
	},
];

export function applyAccentPreset(presetId: AccentPresetId) {
	const fallback = ACCENT_PRESETS[0];
	if (!fallback) return;
	const preset = ACCENT_PRESETS.find((p) => p.id === presetId) ?? fallback;
	document.documentElement.dataset.accent = preset.id;
	document.documentElement.style.setProperty("--accent-hsl", preset.accentHsl);
	document.documentElement.style.setProperty("--mesh-hsl", preset.meshHsl);
}

import type { AccentPresetId } from "@shared/types";
import { ToolbarChrome } from "./ToolbarChrome";

export type ToolbarProps = {
	masterVolume: number;
	alwaysOnTop: boolean;
	showThemePicker: boolean;
	onImport: () => void;
	onStopAll: () => void;
	onMasterVolumePreview: (v: number) => void;
	onMasterVolumeCommit: (v: number) => void;
	onAlwaysOnTop: (v: boolean) => void;
	onAccent: (preset: AccentPresetId) => void;
	onToggleTheme: () => void;
	onCloseTheme: () => void;
	accentPreset: AccentPresetId;
};

export function Toolbar(props: ToolbarProps) {
	return <ToolbarChrome {...props} />;
}

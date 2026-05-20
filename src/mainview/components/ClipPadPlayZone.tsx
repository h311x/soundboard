import type { Clip } from "@shared/types";
import type { ReactNode } from "react";
import { formatHotkeyDisplay } from "../utils/hotkey";

const cancelDragPointer = (e: React.PointerEvent) => {
	e.stopPropagation();
};

function HotkeyShortcutButton({
	className,
	onEditHotkey,
	children,
}: {
	className: string;
	onEditHotkey: () => void;
	children: ReactNode;
}) {
	return (
		<span
			role="button"
			tabIndex={0}
			className={className}
			onPointerDown={cancelDragPointer}
			onClick={(e) => {
				e.stopPropagation();
				onEditHotkey();
			}}
			onKeyDown={(e) => onHotkeyChipKeyDown(e, onEditHotkey)}
		>
			{children}
		</span>
	);
}

function onHotkeyChipKeyDown(
	e: React.KeyboardEvent,
	onEditHotkey: () => void,
): void {
	if (e.key !== "Enter" && e.key !== " ") return;
	e.preventDefault();
	e.stopPropagation();
	onEditHotkey();
}

export function ClipPadPlayZone({
	clip,
	onPlay,
	onEditHotkey,
}: {
	clip: Clip;
	onPlay: () => void;
	onEditHotkey: () => void;
}) {
	return (
		<div
			className="clip-play-zone"
			role="button"
			tabIndex={clip.missing ? -1 : 0}
			aria-disabled={clip.missing || undefined}
			aria-label={`Play ${clip.displayName}`}
			onClick={(e) => onPlayZoneClick(e, clip, onPlay)}
			onKeyDown={(e) => onPlayZoneKeyDown(e, clip, onPlay)}
		>
			<ClipPlayZoneBody clip={clip} onEditHotkey={onEditHotkey} />
		</div>
	);
}

function ClipPlayZoneBody({
	clip,
	onEditHotkey,
}: {
	clip: Clip;
	onEditHotkey: () => void;
}) {
	return (
		<div className="clip-main">
			<div className="clip-body">
				<h3 className="clip-name" title={clip.displayName}>
					{clip.displayName}
				</h3>
				<ClipHotkeyChip
					hasHotkey={Boolean(clip.hotkey)}
					hotkey={clip.hotkey}
					onEditHotkey={onEditHotkey}
				/>
				{clip.missing ? <ClipMissingBadge /> : null}
			</div>
			<span className="clip-play-hint" aria-hidden>
				<svg viewBox="0 0 16 16" width="14" height="14">
					<path d="M5 3.5v9l7.5-4.5L5 3.5z" fill="currentColor" />
				</svg>
			</span>
		</div>
	);
}

function ClipMissingBadge() {
	return <span className="clip-badge warn">Missing file</span>;
}

function ClipHotkeyChip({
	hasHotkey,
	hotkey,
	onEditHotkey,
}: {
	hasHotkey: boolean;
	hotkey: string;
	onEditHotkey: () => void;
}) {
	if (hasHotkey) {
		return (
			<HotkeyShortcutButton
				className="clip-hotkey-display"
				onEditHotkey={onEditHotkey}
			>
				{formatHotkeyDisplay(hotkey)}
			</HotkeyShortcutButton>
		);
	}
	return (
		<HotkeyShortcutButton className="clip-hotkey-set" onEditHotkey={onEditHotkey}>
			Set shortcut
		</HotkeyShortcutButton>
	);
}

function onPlayZoneClick(
	e: React.MouseEvent<HTMLDivElement>,
	clip: Clip,
	onPlay: () => void,
): void {
	if (!canTriggerPlay(e, clip)) return;
	onPlay();
}

function onPlayZoneKeyDown(
	e: React.KeyboardEvent<HTMLDivElement>,
	clip: Clip,
	onPlay: () => void,
): void {
	if (!canTriggerPlayFromKey(e, clip)) return;
	e.preventDefault();
	onPlay();
}

function canTriggerPlay(
	e: React.MouseEvent<HTMLDivElement>,
	clip: Clip,
): boolean {
	if (clip.missing) return false;
	return !isNestedAction(e.target as HTMLElement, e.currentTarget);
}

function canTriggerPlayFromKey(
	e: React.KeyboardEvent<HTMLDivElement>,
	clip: Clip,
): boolean {
	if (clip.missing) return false;
	if (!isActivationKey(e.key)) return false;
	return true;
}

function isActivationKey(key: string): boolean {
	if (key === "Enter") return true;
	return key === " ";
}

function isNestedAction(el: HTMLElement, zone: HTMLElement): boolean {
	const action = el.closest("[role='button']");
	return action != null && action !== zone;
}

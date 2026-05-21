import type { Clip } from "@shared/types";
import type { ReactNode } from "react";
import { formatHotkeyDisplay } from "../utils/hotkey";
import { cn } from "../utils/cn";

const cancelDragPointer = (e: React.PointerEvent) => {
	e.stopPropagation();
};

const hotkeyChipBase =
	"cursor-pointer rounded-full px-2.5 py-1 font-mono text-[0.68rem] tracking-[0.04em] transition-[background,border-color,transform,color] duration-150";

const playZoneBaseClass =
	"relative z-[1] block w-full min-w-0 cursor-pointer border-none bg-transparent px-3.5 pb-2.5 pl-4 pt-3.5 text-left font-inherit text-[var(--text-primary)]";

const playZoneMissingClass = "cursor-not-allowed opacity-70";

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
			className={playZoneClassName(clip.missing)}
			role="button"
			tabIndex={playZoneTabIndex(clip.missing)}
			aria-disabled={playZoneAriaDisabled(clip.missing)}
			aria-label={`Play ${clip.displayName}`}
			onClick={(e) => onPlayZoneClick(e, clip.missing, onPlay)}
			onKeyDown={(e) => onPlayZoneKeyDown(e, clip.missing, onPlay)}
		>
			<ClipPlayZoneBody clip={clip} onEditHotkey={onEditHotkey} />
		</div>
	);
}

function playZoneClassName(missing?: boolean): string {
	return cn(playZoneBaseClass, missing && playZoneMissingClass);
}

function playZoneTabIndex(missing?: boolean): number {
	return missing ? -1 : 0;
}

function playZoneAriaDisabled(missing?: boolean): true | undefined {
	return missing ? true : undefined;
}

function ClipPlayZoneBody({
	clip,
	onEditHotkey,
}: {
	clip: Clip;
	onEditHotkey: () => void;
}) {
	return (
		<div className="flex min-w-0 items-start gap-3">
			<div className="flex min-w-0 flex-1 flex-col items-stretch gap-2">
				<h3
					className="m-0 line-clamp-2 min-h-[2.5em] max-h-[2.5em] w-full min-w-0 max-w-full overflow-hidden text-base font-semibold leading-tight tracking-[-0.02em] [overflow-wrap:anywhere] [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]"
					title={clip.displayName}
				>
					{clip.displayName}
				</h3>
				<ClipHotkeyChip clip={clip} onEditHotkey={onEditHotkey} />
				{clip.missing ? <ClipMissingBadge /> : null}
			</div>
			<ClipPlayHint />
		</div>
	);
}

function ClipPlayHint() {
	return (
		<span
			className="flex size-[34px] shrink-0 items-center justify-center rounded-full border border-[hsl(var(--accent-hsl)/0.28)] bg-[hsl(var(--accent-hsl)/0.14)] text-[hsl(var(--accent-hsl)/0.95)] opacity-55 shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-[opacity,transform,background] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:scale-[1.06] group-data-[playing=true]:opacity-100 group-data-[playing=true]:border-[hsl(var(--accent-hsl)/0.5)] group-data-[playing=true]:bg-[hsl(var(--accent-hsl)/0.28)] active:scale-[0.94] motion-reduce:transition-none"
			aria-hidden
		>
			<svg viewBox="0 0 16 16" width="14" height="14">
				<path d="M5 3.5v9l7.5-4.5L5 3.5z" fill="currentColor" />
			</svg>
		</span>
	);
}

function ClipMissingBadge() {
	return (
		<span className="inline-block rounded-full border border-[rgba(240,160,96,0.25)] bg-[rgba(240,160,96,0.12)] px-2 py-0.5 text-[0.68rem] text-[#f0a060]">
			Missing file
		</span>
	);
}

function ClipHotkeyChip({
	clip,
	onEditHotkey,
}: {
	clip: Clip;
	onEditHotkey: () => void;
}) {
	if (clip.hotkey) {
		return (
			<HotkeyShortcutButton
				className={cn(
					hotkeyChipBase,
					"border border-[hsl(var(--accent-hsl)/0.28)] bg-black/[0.32] text-[hsl(var(--accent-hsl)/0.95)] hover:-translate-y-px hover:border-[hsl(var(--accent-hsl)/0.45)] hover:bg-[hsl(var(--accent-hsl)/0.16)]",
				)}
				onEditHotkey={onEditHotkey}
			>
				{formatHotkeyDisplay(clip.hotkey)}
			</HotkeyShortcutButton>
		);
	}
	return (
		<HotkeyShortcutButton
			className={cn(
				hotkeyChipBase,
				"border border-dashed border-[hsl(var(--accent-hsl)/0.22)] bg-black/20 text-[var(--text-muted)] hover:border-[hsl(var(--accent-hsl)/0.4)] hover:bg-[hsl(var(--accent-hsl)/0.1)] hover:text-[var(--text-primary)]",
			)}
			onEditHotkey={onEditHotkey}
		>
			Set shortcut
		</HotkeyShortcutButton>
	);
}

function onPlayZoneClick(
	e: React.MouseEvent<HTMLDivElement>,
	missing: boolean | undefined,
	onPlay: () => void,
): void {
	if (!canTriggerPlay(e, missing)) return;
	onPlay();
}

function onPlayZoneKeyDown(
	e: React.KeyboardEvent<HTMLDivElement>,
	missing: boolean | undefined,
	onPlay: () => void,
): void {
	if (!canTriggerPlayFromKey(e, missing)) return;
	e.preventDefault();
	onPlay();
}

function canTriggerPlay(
	e: React.MouseEvent<HTMLDivElement>,
	missing?: boolean,
): boolean {
	if (missing) return false;
	return !isNestedAction(e.target as HTMLElement, e.currentTarget);
}

function canTriggerPlayFromKey(
	e: React.KeyboardEvent<HTMLDivElement>,
	missing?: boolean,
): boolean {
	if (missing) return false;
	return isActivationKey(e.key);
}

function isActivationKey(key: string): boolean {
	return key === "Enter" || key === " ";
}

function isNestedAction(el: HTMLElement, zone: HTMLElement): boolean {
	const action = el.closest("[role='button']");
	return action != null && action !== zone;
}

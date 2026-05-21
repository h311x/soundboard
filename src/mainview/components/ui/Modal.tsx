import type { LabelHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { GlassPanel } from "./GlassPanel";

export function ModalOverlay({
	className,
	onClose,
	children,
}: {
	className?: string;
	onClose: () => void;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				"fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-6",
				className,
			)}
			onClick={onClose}
		>
			{children}
		</div>
	);
}

export function ModalSheet({
	className,
	onClick,
	children,
}: {
	className?: string;
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	children: ReactNode;
}) {
	return (
		<GlassPanel
			className={cn("w-full max-w-[360px] rounded-[var(--radius-lg)] p-6", className)}
			onClick={onClick}
		>
			{children}
		</GlassPanel>
	);
}

export function ModalTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h2
			className={cn("mb-4 text-[1.1rem] font-semibold", className)}
			{...props}
		/>
	);
}

export function ModalBody({
	compact,
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement> & { compact?: boolean }) {
	return (
		<p
			className={cn(
				"mb-5 text-[0.9rem] leading-normal text-[var(--text-muted)]",
				compact && "mb-3",
				className,
			)}
			{...props}
		/>
	);
}

export function ModalHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={cn(
				"-mt-2 mb-3.5 text-[0.78rem] leading-snug text-[var(--text-muted)]",
				className,
			)}
			{...props}
		/>
	);
}

export function ModalLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
	return (
		<label
			className={cn("mb-2 block text-[0.8rem] text-[var(--text-muted)]", className)}
			{...props}
		/>
	);
}

export function ModalDivider({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("my-5 h-px bg-[var(--glass-border)]", className)}
			{...props}
		/>
	);
}

export function ModalActions({
	stack,
	className,
	...props
}: HTMLAttributes<HTMLDivElement> & { stack?: boolean }) {
	return (
		<div
			className={cn(
				"flex flex-wrap justify-end gap-2",
				stack && "flex-col items-stretch [&_button]:w-full",
				className,
			)}
			{...props}
		/>
	);
}

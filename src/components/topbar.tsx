"use client";

import { Bell, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useCommandPalette } from "@/components/command-palette";

export function Topbar({
	breadcrumbs,
	routerActive,
}: {
	breadcrumbs: string[];
	routerActive?: string;
}) {
	const { setOpen } = useCommandPalette();
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Avoid SSR/CSR mismatch: theme only known after mount
	useEffect(() => setMounted(true), []);

	// Pre-mount we render dark defaults — matches SSR output regardless of stored theme
	const isDark = !mounted || theme === "dark";
	const nextLabel = isDark ? "light" : "dark";

	return (
		<header
			className="flex items-center gap-3.5 border-b border-border px-5"
			style={{
				height: 56,
				background: "var(--tint-topbar)",
				backdropFilter: "blur(8px)",
				WebkitBackdropFilter: "blur(8px)",
			}}
		>
			{/* Left: Breadcrumbs */}
			<div className="flex items-center gap-1.5 text-sm">
				{breadcrumbs.map((crumb, i) => (
					<span key={crumb} className="flex items-center gap-1.5">
						{i > 0 && <span className="text-fg-mute">/</span>}
						<span
							className={
								i === breadcrumbs.length - 1 ? "font-semibold text-foreground" : "text-fg-dim"
							}
						>
							{crumb}
						</span>
					</span>
				))}
			</div>

			{/* Search trigger — opens command palette */}
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="ml-auto flex cursor-pointer items-center gap-2 rounded-[10px] border border-border px-3 py-1.5 transition-colors hover:border-[color:var(--border-strong)]"
				style={{
					background: "var(--tint-input)",
					width: 320,
				}}
			>
				<Search className="h-3.5 w-3.5 text-fg-mute" />
				<span className="flex-1 text-left text-[13px] text-fg-mute">
					Search anime, theories, people…
				</span>
				<kbd
					className="rounded-[5px] border border-border px-1.5 py-0.5 font-mono text-[11px] text-fg-mute"
					style={{ background: "var(--tint-input)" }}
				>
					⌘K
				</kbd>
			</button>

			{/* Router active chip */}
			{routerActive && (
				<div
					className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono font-semibold text-[11px]"
					style={{
						background: "rgba(91,139,255,.14)",
						color: "var(--brand)",
					}}
				>
					route: {routerActive}
				</div>
			)}

			{/* Model chip */}
			<div
				className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-[5px] text-[12px]"
				style={{ background: "var(--tint-input)", color: "var(--fg-dim)" }}
			>
				<span
					className="inline-block h-[7px] w-[7px] rounded-full"
					style={{ background: "var(--ok)", boxShadow: "0 0 8px var(--ok)" }}
				/>
				<span className="font-mono">qwen2.5-7b</span>
				<span className="text-[10px] text-fg-mute">runpod</span>
			</div>

			{/* Bell icon */}
			<button
				type="button"
				aria-label="Notifications"
				className="grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-[9px] border border-border text-fg-dim transition-colors hover:text-foreground"
				style={{ background: "var(--tint-input)" }}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = "var(--tint-hover)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = "var(--tint-input)";
				}}
			>
				<Bell className="h-4 w-4" />
			</button>

			{/* Theme toggle */}
			<button
				type="button"
				aria-label={`Switch to ${nextLabel} mode`}
				title={`Switch to ${nextLabel} mode`}
				onClick={() => setTheme(isDark ? "light" : "dark")}
				className="grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-[9px] border border-border text-fg-dim transition-colors hover:text-foreground"
				style={{ background: "var(--tint-input)" }}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = "var(--tint-hover)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = "var(--tint-input)";
				}}
			>
				{isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
			</button>
		</header>
	);
}

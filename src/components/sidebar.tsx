"use client";

import {
	BarChart3,
	BookOpen,
	FileText,
	Home,
	LayoutGrid,
	Lightbulb,
	MessageSquare,
	Settings,
	Share2,
	Tv,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/data";

const ICON_MAP: Record<string, React.ElementType> = {
	home: Home,
	catalog: LayoutGrid,
	watch: Tv,
	book: BookOpen,
	chat: MessageSquare,
	theory: Lightbulb,
	graph: Share2,
	report: FileText,
	chart: BarChart3,
	settings: Settings,
};

function hrefForKey(key: string) {
	return key === "home" ? "/" : `/${key}`;
}

export function Sidebar() {
	const pathname = usePathname();

	const groups = Array.from(new Set(NAV_ITEMS.map((n) => n.group)));

	function isActive(key: string) {
		if (key === "home") return pathname === "/";
		return pathname.startsWith(`/${key}`);
	}

	return (
		<aside
			className="flex h-full flex-col border-r border-border"
			style={{
				width: 260,
				background: "var(--tint-sidebar)",
				backdropFilter: "blur(12px)",
				WebkitBackdropFilter: "blur(12px)",
			}}
		>
			{/* Brand */}
			<div className="flex items-center gap-3 border-b border-border border-dashed px-5 pt-5 pb-4">
				<div
					className="relative grid h-9 w-9 place-items-center rounded-[10px]"
					style={{
						background:
							"radial-gradient(circle at 30% 30%, #ff9fbe, transparent 55%), conic-gradient(from 210deg at 50% 50%, var(--sakura), var(--brand), #6ee7d1, var(--sakura))",
						boxShadow: "0 6px 18px rgba(244,63,121,.35), 0 0 0 1px rgba(255,255,255,.08) inset",
					}}
				>
					<span
						className="absolute rounded-[6px] border"
						style={{
							inset: 7,
							background: "var(--bg-1)",
							borderColor: "rgba(255,255,255,.1)",
						}}
					/>
					<span
						className="absolute z-[2] rounded-[3px]"
						style={{
							inset: 11,
							background: "var(--sakura)",
							boxShadow: "0 0 12px var(--sakura)",
						}}
					/>
				</div>
				<div className="leading-tight">
					<div className="text-[15px] font-extrabold tracking-tight text-foreground">
						Otaku Intelligence
					</div>
					<div className="font-mono text-[11px] text-fg-mute">dual-agent · v1.0</div>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto px-2.5 pb-4">
				{groups.map((group) => (
					<div key={group} className="mb-1">
						<div className="px-2.5 pt-2.5 pb-1.5 font-semibold text-[10.5px] uppercase tracking-[0.14em] text-fg-mute">
							{NAV_GROUPS[group]}
						</div>
						{NAV_ITEMS.filter((n) => n.group === group).map((item) => {
							const Icon = ICON_MAP[item.icon] ?? Home;
							const active = isActive(item.key);
							return (
								<Link
									key={item.key}
									href={hrefForKey(item.key)}
									className="group relative flex items-center gap-2.5 rounded-[10px] border border-transparent px-2.5 py-2 text-[13.5px] font-medium transition-colors"
									style={
										active
											? {
													background: "var(--tint-active)",
													color: "var(--fg)",
													borderColor: "rgba(91,139,255,.25)",
													boxShadow: "var(--shadow-1)",
												}
											: { color: "var(--fg-dim)" }
									}
									onMouseEnter={(e) => {
										if (!active) {
											e.currentTarget.style.background = "var(--tint-hover)";
											e.currentTarget.style.color = "var(--fg)";
										}
									}}
									onMouseLeave={(e) => {
										if (!active) {
											e.currentTarget.style.background = "";
											e.currentTarget.style.color = "var(--fg-dim)";
										}
									}}
								>
									{/* Active indicator bar */}
									{active && (
										<span
											className="absolute h-5 w-[3px] rounded-sm"
											style={{
												left: -10,
												top: 8,
												bottom: 8,
												background: "var(--brand)",
											}}
										/>
									)}

									<Icon className="h-4 w-4 shrink-0 opacity-85" />
									<span className="flex-1 truncate">{item.label}</span>

									{/* Pill badge (e.g. "Live") */}
									{"pill" in item && item.pill && (
										<span
											className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none"
											style={{
												background: "rgba(244,63,121,.15)",
												color: "var(--sakura)",
											}}
										>
											{item.pill}
										</span>
									)}

									{/* Count */}
									{"count" in item && item.count !== undefined && (
										<span className="ml-auto font-mono text-[11px] text-fg-mute">{item.count}</span>
									)}

									{/* Role badge */}
									{"role" in item && item.role && (
										<span
											className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider"
											style={{
												background: "rgba(167,139,250,.18)",
												color: "var(--plum)",
											}}
										>
											{item.role}
										</span>
									)}
								</Link>
							);
						})}
					</div>
				))}
			</nav>

			{/* User section */}
			<div className="mt-auto flex items-center gap-2.5 border-t border-border border-dashed px-3 py-3">
				<div
					className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12.5px] font-bold"
					style={{
						background: "linear-gradient(135deg, #ffb8d1, #7aa2ff)",
						color: "#0c1020",
						boxShadow: "0 0 0 2px rgba(255,255,255,.05)",
					}}
				>
					ER
				</div>
				<div className="min-w-0 leading-tight">
					<div className="truncate text-[13px] font-semibold text-foreground">Ersapta</div>
					<div className="truncate text-[11px] text-fg-mute">admin · GMT+7</div>
				</div>
				<Settings className="ml-auto h-3.5 w-3.5 text-fg-mute" />
			</div>
		</aside>
	);
}

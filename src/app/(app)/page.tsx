"use client";

import {
	ArrowDownToLine,
	BookOpen,
	Clock,
	EyeOff,
	MessageSquare,
	ShieldCheck,
	Zap,
} from "lucide-react";
import { LineChart } from "@/components/line-chart";
import { PosterCard } from "@/components/poster-card";
import { Sparkline } from "@/components/sparkline";
import type { DataPoint } from "@/lib/data";
import { ANIME_LIBRARY, CONVERSATIONS, SEASONAL_SENT } from "@/lib/data";

/* ── tiny sparkline data for KPI cards ── */
const kpiSpark: DataPoint[][] = [
	[
		{ d: "1", v: 28000 },
		{ d: "2", v: 29200 },
		{ d: "3", v: 29800 },
		{ d: "4", v: 30100 },
		{ d: "5", v: 30412 },
	],
	[
		{ d: "1", v: 5 },
		{ d: "2", v: 6 },
		{ d: "3", v: 6 },
		{ d: "4", v: 7 },
		{ d: "5", v: 7 },
	],
	[
		{ d: "1", v: 142 },
		{ d: "2", v: 156 },
		{ d: "3", v: 168 },
		{ d: "4", v: 175 },
		{ d: "5", v: 184 },
	],
	[
		{ d: "1", v: 8 },
		{ d: "2", v: 9 },
		{ d: "3", v: 10 },
		{ d: "4", v: 11 },
		{ d: "5", v: 12 },
	],
];

const KPIS = [
	{ label: "Titles indexed", value: "30,412", spark: kpiSpark[0], color: "var(--brand)" },
	{ label: "Watching now", value: "7", spark: kpiSpark[1], color: "var(--sakura)" },
	{ label: "Queries this week", value: "184", spark: kpiSpark[2], color: "var(--teal)" },
	{ label: "Theories tracked", value: "12", spark: kpiSpark[3], color: "var(--plum)" },
];

const WATCHING = ANIME_LIBRARY.filter(
	(a) => a.status === "Watching" || a.status === "Airing",
).slice(0, 3);

const DELIVERIES = [
	{ label: "Weekly digest", next: "Mon 09:00", progress: 72, color: "var(--brand)" },
	{ label: "Theory update", next: "Wed 14:00", progress: 45, color: "var(--plum)" },
];

/* ── Circular progress ring ── */
function CircularProgress({
	progress,
	color,
	size = 56,
}: {
	progress: number;
	color: string;
	size?: number;
}) {
	const r = (size - 6) / 2;
	const circ = 2 * Math.PI * r;
	const offset = circ * (1 - progress / 100);
	return (
		<svg width={size} height={size} className="-rotate-90">
			<circle
				cx={size / 2}
				cy={size / 2}
				r={r}
				fill="none"
				stroke="var(--tint-hover)"
				strokeWidth={4}
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={r}
				fill="none"
				stroke={color}
				strokeWidth={4}
				strokeDasharray={circ}
				strokeDashoffset={offset}
				strokeLinecap="round"
			/>
		</svg>
	);
}

/* shared card surface */
const cardStyle: React.CSSProperties = {
	background: "var(--tint-card)",
	boxShadow: "var(--shadow-2)",
};

export default function HomePage() {
	return (
		<div className="space-y-6 p-6 pb-12">
			{/* ── Hero Card ── */}
			<section
				className="relative overflow-hidden rounded-2xl border border-border p-8"
				style={{
					background:
						"linear-gradient(135deg, rgba(244,63,121,.12) 0%, rgba(91,139,255,.10) 50%, var(--tint-card) 100%)",
					boxShadow: "var(--shadow-2)",
				}}
			>
				<div className="flex items-start justify-between gap-8">
					<div className="max-w-xl space-y-4">
						<h1 className="text-2xl font-bold tracking-tight text-foreground">
							Good morning, Ersapta{" "}
							<span className="font-[var(--font-jp)] text-lg text-fg-dim">お疲れ様</span>
						</h1>
						<p className="text-sm leading-relaxed text-fg-dim">
							Your watchlist has 3 new episodes since yesterday. The seasonal sentiment index is up
							4 points and 2 theories have been updated by the research agent.
						</p>
						<div className="flex flex-wrap gap-3 pt-1">
							<button
								type="button"
								className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-white transition-[filter]"
								style={{
									background: "linear-gradient(180deg, var(--brand), var(--brand-2))",
									borderColor: "rgba(255,255,255,.15)",
									boxShadow: "0 6px 18px rgba(91,139,255,.35), inset 0 1px 0 rgba(255,255,255,.2)",
								}}
							>
								<MessageSquare className="h-4 w-4" />
								Ask the agents
							</button>
							<button
								type="button"
								className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors"
								style={{ background: "var(--tint-chip)" }}
							>
								<BookOpen className="h-4 w-4" />
								Today&apos;s digest
							</button>
							<button
								type="button"
								className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors"
								style={{ background: "var(--tint-chip)" }}
							>
								<Zap className="h-4 w-4" />2 theories updated
							</button>
						</div>
					</div>

					{/* Status chips */}
					<div className="hidden shrink-0 space-y-2 lg:block">
						{[
							{ label: "Router health", icon: ShieldCheck, status: "Healthy", color: "var(--ok)" },
							{ label: "Spoiler guard", icon: EyeOff, status: "Active", color: "var(--ok)" },
							{ label: "Ingest", icon: ArrowDownToLine, status: "Syncing", color: "var(--amber)" },
						].map((chip) => (
							<div
								key={chip.label}
								className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px]"
								style={{ background: "var(--tint-input)" }}
							>
								<chip.icon className="h-3.5 w-3.5 text-fg-mute" />
								<span className="text-fg-mute">{chip.label}</span>
								<span className="ml-auto font-medium" style={{ color: chip.color }}>
									{chip.status}
								</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── KPI Strip ── */}
			<section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{KPIS.map((kpi) => (
					<div
						key={kpi.label}
						className="flex items-center justify-between rounded-xl border border-border p-5"
						style={cardStyle}
					>
						<div>
							<div className="text-2xl font-bold text-foreground">{kpi.value}</div>
							<div className="mt-1 text-xs text-fg-mute">{kpi.label}</div>
						</div>
						<Sparkline data={kpi.spark} stroke={kpi.color} fill={`${kpi.color}22`} />
					</div>
				))}
			</section>

			{/* ── Currently Watching + Sentiment ── */}
			<section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
				{/* Currently watching */}
				<div className="rounded-xl border border-border p-5" style={cardStyle}>
					<h2 className="mb-4 text-sm font-semibold text-foreground">Currently Watching</h2>
					<div className="space-y-4">
						{WATCHING.map((anime) => (
							<div key={anime.id} className="flex items-center gap-4">
								<PosterCard anime={anime} size="sm" />
								<div className="min-w-0 flex-1">
									<div className="truncate text-sm font-medium text-foreground">{anime.title}</div>
									<div className="mt-0.5 text-xs text-fg-mute">{anime.studio}</div>
									{/* Progress bar */}
									<div className="mt-2.5 flex items-center gap-2">
										<div
											className="h-1.5 flex-1 overflow-hidden rounded-full"
											style={{ background: "var(--tint-hover)" }}
										>
											<div
												className="h-full rounded-full transition-all"
												style={{
													width: `${(anime.progress / anime.ep) * 100}%`,
													background: anime.color,
												}}
											/>
										</div>
										<span className="shrink-0 font-mono text-[11px] text-fg-mute">
											{anime.progress}/{anime.ep}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Seasonal sentiment chart */}
				<div className="rounded-xl border border-border p-5" style={cardStyle}>
					<h2 className="mb-4 text-sm font-semibold text-foreground">Seasonal Sentiment</h2>
					<LineChart data={SEASONAL_SENT} stroke="var(--sakura)" fill="rgba(244,63,121,.12)" />
				</div>
			</section>

			{/* ── Recent Conversations + Scheduled Deliveries ── */}
			<section className="grid gap-6 lg:grid-cols-[1fr_340px]">
				{/* Recent conversations */}
				<div className="rounded-xl border border-border p-5" style={cardStyle}>
					<h2 className="mb-4 text-sm font-semibold text-foreground">Recent Conversations</h2>
					<div className="space-y-1">
						{CONVERSATIONS.slice(0, 5).map((conv) => (
							<button
								type="button"
								key={conv.id}
								className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
								onMouseEnter={(e) => {
									e.currentTarget.style.background = "var(--tint-hover)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = "";
								}}
							>
								<MessageSquare
									className="h-4 w-4 shrink-0"
									style={{
										color: conv.active ? "var(--brand)" : "var(--fg-mute)",
									}}
								/>
								<span className="flex-1 truncate text-sm text-foreground">{conv.title}</span>
								<span className="shrink-0 font-mono text-[11px] text-fg-mute">{conv.when}</span>
							</button>
						))}
					</div>
				</div>

				{/* Scheduled deliveries */}
				<div className="rounded-xl border border-border p-5" style={cardStyle}>
					<h2 className="mb-4 text-sm font-semibold text-foreground">Scheduled Deliveries</h2>
					<div className="space-y-5">
						{DELIVERIES.map((d) => (
							<div key={d.label} className="flex items-center gap-4">
								<CircularProgress progress={d.progress} color={d.color} />
								<div>
									<div className="text-sm font-medium text-foreground">{d.label}</div>
									<div className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-mute">
										<Clock className="h-3 w-3" />
										Next: {d.next}
									</div>
									<div className="mt-1 font-mono text-[11px] text-fg-mute">
										{d.progress}% prepared
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}

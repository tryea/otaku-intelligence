import type { AnimeEntry } from "@/lib/data";

const SIZES = {
	sm: { w: 120, h: 168 },
	md: { w: 148, h: 208 },
	lg: { w: 200, h: 280 },
} as const;

export function PosterCard({
	anime,
	size = "md",
	onClick,
}: {
	anime: AnimeEntry;
	size?: keyof typeof SIZES;
	onClick?: () => void;
}) {
	const s = SIZES[size];
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set when interactive
		<div
			role={onClick ? "button" : undefined}
			tabIndex={onClick ? 0 : undefined}
			className="relative overflow-hidden rounded-[10px] border border-border"
			style={{
				width: s.w,
				height: s.h,
				cursor: onClick ? "pointer" : "default",
				background:
					"repeating-linear-gradient(135deg, rgba(255,255,255,.05) 0 6px, transparent 6px 12px), linear-gradient(160deg, #131830, #1d2344)",
			}}
			onClick={onClick}
			onKeyDown={
				onClick
					? (e) => {
							if (e.key === "Enter" || e.key === " ") onClick();
						}
					: undefined
			}
		>
			<div className="absolute top-2 left-2 rounded-[5px] bg-black/55 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-dim">
				{anime.type}
			</div>
			<div
				className="absolute inset-0 grid place-items-center font-[var(--font-jp)] font-bold"
				style={{
					fontSize: size === "lg" ? 80 : 52,
					color: `${anime.color}44`,
					letterSpacing: "-0.04em",
				}}
			>
				{anime.glyph}
			</div>
			<div className="absolute bottom-2 left-2 right-2 flex justify-between gap-2 font-mono text-[11px] text-fg-mute">
				<span style={{ color: anime.color }}>{anime.jp}</span>
				<span>{anime.score.toFixed(2)}</span>
			</div>
		</div>
	);
}

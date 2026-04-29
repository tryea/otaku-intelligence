import type { DataPoint } from "@/lib/data";

export function LineChart({
	data,
	w = 760,
	h = 200,
	stroke = "var(--brand)",
	fill = "rgba(91,139,255,.14)",
}: {
	data: DataPoint[];
	w?: number;
	h?: number;
	stroke?: string;
	fill?: string;
}) {
	const values = data.map((d) => d.v);
	const min = Math.min(...values, 0);
	const max = Math.max(...values, 100);
	const padL = 36,
		padB = 22,
		padT = 10,
		padR = 12;
	const iw = w - padL - padR;
	const ih = h - padT - padB;
	const pts = data.map((d, i) => {
		const x = padL + (i * iw) / (data.length - 1);
		const y = padT + ih - ((d.v - min) / Math.max(1, max - min)) * ih;
		return { x, y, d };
	});
	const path = pts.map((p, i) => `${(i ? "L" : "M") + p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
	const area = `${path} L${padL + iw},${padT + ih} L${padL},${padT + ih} Z`;
	const ticks = [0, 25, 50, 75, 100];

	return (
		<svg width="100%" viewBox={`0 0 ${w} ${h}`} className="block">
			{ticks.map((t) => {
				const y = padT + ih - ((t - min) / Math.max(1, max - min)) * ih;
				return (
					<g key={t}>
						<line
							x1={padL}
							x2={padL + iw}
							y1={y}
							y2={y}
							stroke="rgba(255,255,255,.06)"
							strokeDasharray="2 3"
						/>
						<text
							x={padL - 8}
							y={y + 3}
							fontSize="10"
							fill="var(--fg-mute)"
							textAnchor="end"
							fontFamily="var(--font-mono)"
						>
							{t}
						</text>
					</g>
				);
			})}
			<path d={area} fill={fill} />
			<path
				d={path}
				fill="none"
				stroke={stroke}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{pts.map((p, i) =>
				i % 3 === 0 ? (
					<circle key={`dot-${p.d.d}`} cx={p.x} cy={p.y} r="2.5" fill={stroke} />
				) : null,
			)}
			{pts.map((p, i) =>
				i % Math.ceil(pts.length / 6) === 0 ? (
					<text
						key={`lbl-${p.d.d}`}
						x={p.x}
						y={h - 6}
						fontSize="10"
						fill="var(--fg-mute)"
						textAnchor="middle"
						fontFamily="var(--font-mono)"
					>
						{p.d.d}
					</text>
				) : null,
			)}
		</svg>
	);
}

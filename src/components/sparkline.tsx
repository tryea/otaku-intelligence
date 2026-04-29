import type { DataPoint } from "@/lib/data";

export function Sparkline({
	data,
	w = 120,
	h = 32,
	stroke = "var(--brand)",
	fill = "rgba(91,139,255,.15)",
}: {
	data: DataPoint[];
	w?: number;
	h?: number;
	stroke?: string;
	fill?: string;
}) {
	const values = data.map((d) => d.v);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const pad = 2;
	const pts = data.map((d, i) => {
		const x = pad + (i * (w - pad * 2)) / (data.length - 1);
		const y = h - pad - ((d.v - min) / Math.max(1, max - min)) * (h - pad * 2);
		return [x, y] as const;
	});
	const path = pts
		.map((p, i) => `${(i ? "L" : "M") + p[0].toFixed(1)},${p[1].toFixed(1)}`)
		.join(" ");
	const area = `${path} L${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} L${pad},${(h - pad).toFixed(1)} Z`;

	return (
		<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
			<path d={area} fill={fill} />
			<path
				d={path}
				fill="none"
				stroke={stroke}
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

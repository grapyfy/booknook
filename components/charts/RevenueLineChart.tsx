"use client";

// Single-series line chart (revenue over the last 7 days), hand-rolled SVG —
// no charting library needed for one line. Follows the dataviz skill's mark
// specs: 2px line, rounded caps, hairline gridlines, hover crosshair + tooltip,
// single series so no legend box (the title already names it).
import { useState } from "react";

const WIDTH = 560;
const HEIGHT = 200;
const PADDING = { top: 16, right: 16, bottom: 28, left: 48 };

function niceMax(max: number): number {
  if (max <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function RevenueLineChart({ data }: { data: { date: string; amount: number }[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const maxAmount = niceMax(Math.max(...data.map((d) => d.amount), 1));

  const xFor = (i: number) => PADDING.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
  const yFor = (v: number) => PADDING.top + innerHeight - (v / maxAmount) * innerHeight;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(d.amount)}`).join(" ");
  const areaPath = `${linePath} L ${xFor(data.length - 1)} ${PADDING.top + innerHeight} L ${xFor(0)} ${PADDING.top + innerHeight} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = (x - PADDING.left) / innerWidth;
    const index = Math.round(ratio * (data.length - 1));
    setHoverIndex(Math.min(Math.max(index, 0), data.length - 1));
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Revenue over the last 7 days">
        {gridLines.map((g) => {
          const y = PADDING.top + innerHeight * (1 - g);
          return (
            <line
              key={g}
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y}
              y2={y}
              stroke="#e1e0d9"
              strokeWidth={1}
            />
          );
        })}
        {gridLines.map((g) => {
          const y = PADDING.top + innerHeight * (1 - g);
          return (
            <text key={g} x={PADDING.left - 8} y={y + 3} textAnchor="end" className="fill-neutral-400 text-[10px] font-mono">
              ₹{Math.round(maxAmount * g).toLocaleString("en-IN")}
            </text>
          );
        })}

        <path d={areaPath} fill="#2563eb" opacity={0.08} />
        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => (
          <circle key={d.date} cx={xFor(i)} cy={yFor(d.amount)} r={hoverIndex === i ? 5 : 4} fill="#2563eb" stroke="#fff" strokeWidth={2} />
        ))}

        {data.map((d, i) => (
          <text key={d.date} x={xFor(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-neutral-400 text-[10px] font-mono">
            {new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" })}
          </text>
        ))}

        {hoverIndex !== null && (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={PADDING.top}
            y2={PADDING.top + innerHeight}
            stroke="#c3c2b7"
            strokeWidth={1}
          />
        )}

        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={innerWidth}
          height={innerHeight}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div
          className="absolute top-2 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs shadow-sm pointer-events-none"
          style={{ left: `${(xFor(hoverIndex!) / WIDTH) * 100}%`, transform: "translateX(-50%)" }}
        >
          <div className="text-neutral-400">{hovered.date}</div>
          <div className="font-mono font-medium">₹{hovered.amount.toLocaleString("en-IN")}</div>
        </div>
      )}
    </div>
  );
}

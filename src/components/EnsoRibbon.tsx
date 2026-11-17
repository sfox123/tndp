"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EnsoEvent } from "@/lib/enso/types";
import { monthAt, monthLabel, signed } from "@/lib/format";

const W = 1100;
const H = 310;
const M = { top: 34, right: 54, bottom: 30, left: 40 };
const MAX = 2.7;

// Diverging scale: three warm steps, a neutral band inside ±0.5 °C, three cool steps.
const CLASSES = [
  { test: (v: number) => v >= 15, color: "var(--warm-3)" },
  { test: (v: number) => v >= 10 && v < 15, color: "var(--warm-2)" },
  { test: (v: number) => v >= 5 && v < 10, color: "var(--warm-1)" },
  { test: (v: number) => v > -5 && v < 5, color: "var(--neutral)" },
  { test: (v: number) => v <= -5 && v > -10, color: "var(--cool-1)" },
  { test: (v: number) => v <= -10 && v > -15, color: "var(--cool-2)" },
  { test: (v: number) => v <= -15, color: "var(--cool-3)" },
];

/**
 * Every month of the Relative Oceanic Niño Index since 1950 as one bar:
 * warm above the line (El Niño), cool below (La Niña).
 */
export function EnsoRibbon({ tenths, start, events }: { tenths: number[]; start: string; events: EnsoEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  // On narrow screens the chart scrolls sideways: start at the present day.
  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth;
  }, []);

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const zero = M.top + plotH / 2;
  const step = plotW / tenths.length;
  const y = (deg: number) => zero - (deg / MAX) * (plotH / 2);
  const x = (i: number) => M.left + i * step;
  const startYear = Number(start.slice(0, 4));
  const indexOf = (ym: string) => (Number(ym.slice(0, 4)) - startYear) * 12 + Number(ym.slice(5, 7)) - 1;

  const paths = useMemo(
    () =>
      CLASSES.map((c) => {
        let d = "";
        tenths.forEach((v, i) => {
          if (!c.test(v)) return;
          const top = v >= 0 ? y(v / 10) : zero;
          const height = Math.max(Math.abs(y(v / 10) - zero), 1);
          d += `M${x(i).toFixed(2)} ${top.toFixed(2)}h${(step * 0.86).toFixed(2)}v${height.toFixed(2)}h-${(step * 0.86).toFixed(2)}z`;
        });
        return { color: c.color, d };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenths],
  );

  const last = tenths.length - 1;
  const current = tenths[last] / 10;
  const labelled = events.filter((e) => e.peak >= 2 && indexOf(e.peakMonth) < last - 6);
  const decades = [];
  for (let year = Math.ceil(startYear / 10) * 10; year <= startYear + tenths.length / 12; year += 10)
    decades.push(year);

  function onMove(event: React.PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const i = Math.floor(((event.clientX - box.left) / box.width) * tenths.length);
    setHover(Math.max(0, Math.min(last, i)));
  }

  return (
    <div className="chart" ref={ref}>
      <div className="legend" aria-hidden="true">
        <span>
          <i style={{ ["--k" as string]: "var(--warm-2)" }} /> El Niño, +0.5 °C or above
        </span>
        <span>
          <i style={{ ["--k" as string]: "var(--neutral)" }} /> Neutral
        </span>
        <span>
          <i style={{ ["--k" as string]: "var(--cool-2)" }} /> La Niña, −0.5 °C or below
        </span>
      </div>
      <div className="chart__inner" style={{ ["--chart-min" as string]: "860px" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Relative Oceanic Niño Index by month from ${monthLabel(start)} to ${monthLabel(monthAt(start, last))}. The latest value is ${signed(current)} degrees Celsius.`}
        >
          {[-2, -1, 1, 2].map((v) => (
            <g key={v}>
              <line className="grid" x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} />
              <text x={M.left - 8} y={y(v) + 4} textAnchor="end">
                {signed(v, 0)}
              </text>
            </g>
          ))}
          <text x={M.left - 8} y={zero + 4} textAnchor="end">
            0
          </text>
          <text x={M.left - 8} y={M.top - 16} textAnchor="start">
            °C
          </text>
          {decades.map((year) => (
            <text key={year} x={x((year - startYear) * 12)} y={H - 8} textAnchor="middle">
              {year}
            </text>
          ))}

          <g className="ribbon-reveal">
            {paths.map((p) => (
              <path key={p.color} d={p.d} fill={p.color} />
            ))}
          </g>
          <line className="axis" x1={M.left} x2={W - M.right} y1={zero} y2={zero} />

          {labelled.map((e) => {
            const i = indexOf(e.peakMonth);
            return (
              <text key={e.name} x={x(i)} y={y(e.peak) - 7} textAnchor="middle">
                {e.name}
              </text>
            );
          })}

          <circle className="now-marker" cx={x(last) + step / 2} cy={y(current)} r="5" fill="var(--warm-3)" />
          <circle
            cx={x(last) + step / 2}
            cy={y(current)}
            r="4"
            fill="var(--warm-3)"
            stroke="var(--card)"
            strokeWidth="1.5"
          />
          <text className="label-strong" x={x(last) + 10} y={y(current) - 8}>
            Now
          </text>
          <text className="label-strong" x={x(last) + 10} y={y(current) + 7}>
            {signed(current)}
          </text>

          {hover !== null && (
            <line
              x1={x(hover) + step / 2}
              x2={x(hover) + step / 2}
              y1={M.top}
              y2={H - M.bottom}
              stroke="var(--ink)"
              strokeWidth="1"
            />
          )}
          <rect
            x={M.left}
            y={M.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {hover !== null && (
          <div
            className="tip"
            style={{
              left: `${((x(hover) + step / 2) / W) * 100}%`,
              top: `${(Math.min(y(tenths[hover] / 10), zero) / H) * 100}%`,
            }}
          >
            {monthLabel(monthAt(start, hover))}: <b>{signed(tenths[hover] / 10)} °C</b>
          </div>
        )}
      </div>
    </div>
  );
}

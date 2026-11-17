import type { DailyForecast, DatedValue, ProbabilityWindow, S2SWeek } from "@/lib/enso/types";
import { dayLabel, monthLabel, percent, signed } from "@/lib/format";

/* ------------------------------------------------------------------
   Chance of El Niño, neutral or La Niña for each coming season
   ------------------------------------------------------------------ */
export function ProbabilityBars({ windows }: { windows: ProbabilityWindow[] }) {
  const W = 560;
  const row = 30;
  const left = 132;
  const barW = W - left - 4;
  const H = windows.length * row + 22;
  const segments = (w: ProbabilityWindow) => [
    {
      key: "Strong or very strong El Niño",
      share: Math.min(w.strongPlus, w.elNino),
      color: "var(--warm-3)",
      ink: "#fff",
    },
    { key: "Weaker El Niño", share: Math.max(w.elNino - w.strongPlus, 0), color: "var(--warm-1)", ink: "var(--ink)" },
    { key: "Neutral", share: w.neutral, color: "var(--neutral)", ink: "var(--ink)" },
    { key: "La Niña", share: w.laNina, color: "var(--cool-2)", ink: "#fff" },
  ];

  return (
    <div className="chart">
      <div className="legend" aria-hidden="true">
        <span>
          <i style={{ ["--k" as string]: "var(--warm-3)" }} /> Strong or very strong El Niño
        </span>
        <span>
          <i style={{ ["--k" as string]: "var(--warm-1)" }} /> Weaker El Niño
        </span>
        <span>
          <i style={{ ["--k" as string]: "var(--neutral)" }} /> Neutral
        </span>
        <span>
          <i style={{ ["--k" as string]: "var(--cool-2)" }} /> La Niña
        </span>
      </div>
      <div className="chart__inner">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Chance of El Niño, neutral or La Niña conditions for each coming three-month season"
        >
          {[0, 0.5, 1].map((t) => (
            <text key={t} x={left + t * barW} y={H - 4} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"}>
              {t * 100}%
            </text>
          ))}
          {windows.map((w, r) => {
            let offset = 0;
            return (
              <g key={w.season} transform={`translate(0 ${r * row})`}>
                <text className="label-strong" x={left - 10} y={row / 2 + 2} textAnchor="end">
                  {w.months}
                </text>
                {segments(w).map((s) => {
                  const width = s.share * barW;
                  const x0 = left + offset;
                  offset += width;
                  if (width < 0.5) return null;
                  return (
                    <g key={s.key}>
                      <rect x={x0 + 1} y={4} width={Math.max(width - 2, 1)} height={row - 10} rx="3" fill={s.color}>
                        <title>{`${w.months}: ${s.key}, ${percent(s.share)}`}</title>
                      </rect>
                      {width > 44 && (
                        <text x={x0 + 8} y={row / 2 + 3} style={{ fill: s.ink, fontWeight: 600 }} pointerEvents="none">
                          {percent(s.share)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   A single index over time with its threshold band
   ------------------------------------------------------------------ */
export function IndexLine({
  points,
  upper,
  lower,
  upperLabel,
  lowerLabel,
  unit = "",
  digits = 1,
  monthly = false,
  label,
}: {
  points: DatedValue[];
  upper: number;
  lower: number;
  upperLabel: string;
  lowerLabel: string;
  unit?: string;
  digits?: number;
  monthly?: boolean;
  label: string;
}) {
  const W = 520;
  const H = 190;
  const M = { top: 14, right: 64, bottom: 26, left: 112 };
  const values = points.map((p) => p.value);
  const hi = Math.max(...values, upper) * 1.15;
  const lo = Math.min(...values, lower) * 1.15;
  const x = (i: number) => M.left + (i / (points.length - 1)) * (W - M.left - M.right);
  const y = (v: number) => M.top + ((hi - v) / (hi - lo)) * (H - M.top - M.bottom);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join("");
  const last = points[points.length - 1];
  const fmt = (p: DatedValue) => (monthly ? monthLabel(p.date) : dayLabel(p.date));
  const ticks = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <div className="chart">
      <div className="chart__inner">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${label}. Latest value ${signed(last.value, digits)}${unit}.`}
        >
          <rect x={M.left} y={y(upper)} width={W - M.left - M.right} height={y(lower) - y(upper)} fill="var(--paper)" />
          <line className="grid" x1={M.left} x2={W - M.right} y1={y(upper)} y2={y(upper)} strokeDasharray="3 4" />
          <line className="grid" x1={M.left} x2={W - M.right} y1={y(lower)} y2={y(lower)} strokeDasharray="3 4" />
          <line className="axis" x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} />
          <text x={M.left - 8} y={y(upper) + 4} textAnchor="end">
            {upperLabel}, {signed(upper, digits)}
          </text>
          <text x={M.left - 8} y={y(lower) + 4} textAnchor="end">
            {lowerLabel}, {signed(lower, digits)}
          </text>
          <text x={M.left - 8} y={y(0) + 4} textAnchor="end">
            0
          </text>
          <path d={d} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle key={p.date} cx={x(i)} cy={y(p.value)} r="9" fill="transparent">
              <title>{`${fmt(p)}: ${signed(p.value, digits)}${unit}`}</title>
            </circle>
          ))}
          <circle
            cx={x(points.length - 1)}
            cy={y(last.value)}
            r="4.5"
            fill="var(--ink)"
            stroke="var(--card)"
            strokeWidth="2"
          />
          <text className="label-strong" x={x(points.length - 1) + 9} y={y(last.value) + 4}>
            {signed(last.value, digits)}
            {unit}
          </text>
          {ticks.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 6}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            >
              {fmt(points[i])}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Weekly rainfall anomaly, six weeks ahead
   ------------------------------------------------------------------ */
export function WeekBars({
  anomalies,
  weeks,
  drierPct,
  threshold,
  label,
}: {
  anomalies: number[];
  weeks: S2SWeek[];
  drierPct?: number[];
  threshold?: number;
  label: string;
}) {
  const W = 520;
  const H = 230;
  const M = { top: 22, right: threshold === undefined ? 12 : 84, bottom: 30, left: 52 };
  const hi = Math.max(6, ...anomalies) + 4;
  const lo = Math.min(-30, ...anomalies, threshold ?? 0) - 8;
  const band = (W - M.left - M.right) / anomalies.length;
  const barW = Math.min(46, band - 14);
  const y = (v: number) => M.top + ((hi - v) / (hi - lo)) * (H - M.top - M.bottom);

  return (
    <div className="chart">
      <div className="chart__inner">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
          {[-40, -20, 0]
            .filter((v) => v > lo)
            .map((v) => (
              <g key={v}>
                <line className={v === 0 ? "axis" : "grid"} x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} />
                <text x={M.left - 8} y={y(v) + 4} textAnchor="end">
                  {v === 0 ? "Normal" : signed(v, 0)}
                </text>
              </g>
            ))}
          <text x={M.left - 8} y={12} textAnchor="end">
            mm
          </text>
          {anomalies.map((v, i) => {
            const cx = M.left + band * i + band / 2;
            const top = Math.min(y(v), y(0));
            const height = Math.max(Math.abs(y(v) - y(0)), 2);
            const week = weeks[i];
            return (
              <g key={i}>
                <rect
                  x={cx - barW / 2}
                  y={top}
                  width={barW}
                  height={height}
                  rx="4"
                  fill={v < 0 ? "var(--dry)" : "var(--wet)"}
                >
                  <title>
                    {`${week ? `${dayLabel(week.from)} to ${dayLabel(week.to)}` : `Week ${i + 1}`}: ${signed(v)} mm against normal` +
                      (drierPct ? `; ${drierPct[i]}% of the area significantly drier` : "")}
                  </title>
                </rect>
                <text className="label-strong" x={cx} y={v < 0 ? y(v) + 15 : y(v) - 6} textAnchor="middle">
                  {signed(v, 0)}
                </text>
                <text x={cx} y={H - 8} textAnchor="middle">
                  {week ? dayLabel(week.from) : `Week ${i + 1}`}
                </text>
              </g>
            );
          })}
          {threshold !== undefined && (
            <g>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={y(threshold)}
                y2={y(threshold)}
                stroke="var(--ink)"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text className="label-strong" x={W - M.right + 8} y={y(threshold) + 4}>
                Watch line
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Daily rain for the next sixteen days
   ------------------------------------------------------------------ */
export function DailyRain({ days, label }: { days: DailyForecast[]; label: string }) {
  const W = 520;
  const H = 230;
  const M = { top: 22, right: 12, bottom: 30, left: 44 };
  const max = Math.max(...days.map((d) => d.rainMm), 5);
  const hi = Math.ceil(max / 5) * 5;
  const band = (W - M.left - M.right) / days.length;
  const y = (v: number) => M.top + ((hi - v) / hi) * (H - M.top - M.bottom);
  const peak = days.reduce((a, b) => (b.rainMm > a.rainMm ? b : a));

  return (
    <div className="chart">
      <div className="chart__inner">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
          {[0, hi / 2, hi].map((v) => (
            <g key={v}>
              <line className={v === 0 ? "axis" : "grid"} x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} />
              <text x={M.left - 8} y={y(v) + 4} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          <text x={M.left - 8} y={12} textAnchor="end">
            mm
          </text>
          {days.map((d, i) => {
            const cx = M.left + band * i + band / 2;
            const height = Math.max(y(0) - y(d.rainMm), 1.5);
            return (
              <g key={d.date}>
                <rect
                  x={cx - (band - 6) / 2}
                  y={y(0) - height}
                  width={band - 6}
                  height={height}
                  rx="3"
                  fill="var(--wet)"
                >
                  <title>{`${dayLabel(d.date)}: ${d.rainMm.toFixed(1)} mm, ${d.tempC.toFixed(1)} °C`}</title>
                </rect>
                {d === peak && (
                  <text className="label-strong" x={cx} y={y(d.rainMm) - 6} textAnchor="middle">
                    {d.rainMm.toFixed(1)}
                  </text>
                )}
                {i % 4 === 0 && (
                  <text x={cx} y={H - 8} textAnchor="middle">
                    {dayLabel(d.date)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

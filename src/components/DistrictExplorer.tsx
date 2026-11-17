"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { STAGES } from "@/lib/content";
import type { District, S2SWeek } from "@/lib/enso/types";
import { signed } from "@/lib/format";
import { DEFAULT_THRESHOLDS, THRESHOLD_RANGE, meanAnomaly, stageFor } from "@/lib/triggers";
import type { Thresholds } from "@/lib/triggers";
import { WeekBars } from "./Charts";
import { useStage } from "./StageProvider";

// Plain equirectangular projection, corrected for Tamil Nadu's latitude.
const LON_MIN = 76.1;
const LAT_MAX = 13.65;
const SCALE = 100;
const K = Math.cos((10.8 * Math.PI) / 180);
const MAP_W = (80.5 - LON_MIN) * K * SCALE;
const MAP_H = (LAT_MAX - 7.95) * SCALE;
const project = (lon: number, lat: number): [number, number] => [(lon - LON_MIN) * K * SCALE, (LAT_MAX - lat) * SCALE];

const STAGE_FILL = ["var(--s0)", "var(--s1)", "var(--s2)"];

export function DistrictExplorer({
  districts,
  weeks,
  outline,
}: {
  districts: District[];
  weeks: S2SWeek[];
  outline: [number, number][];
}) {
  const router = useRouter();
  const { setStage } = useStage();
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [hovered, setHovered] = useState<number | null>(null);

  const staged = useMemo(
    () => districts.map((d) => ({ district: d, stage: stageFor(d, thresholds), mean: meanAnomaly(d) })),
    [districts, thresholds],
  );
  const counts = [0, 1, 2].map((s) => staged.filter((d) => d.stage === s).length);

  // Start on the district with the strongest signal.
  const initial = useMemo(
    () => [...staged].sort((a, b) => b.stage - a.stage || a.mean - b.mean)[0].district.code,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [districts],
  );
  const [selected, setSelected] = useState<number>(initial);

  useEffect(() => {
    const code = Number(new URLSearchParams(window.location.search).get("district"));
    if (districts.some((d) => d.code === code)) setSelected(code);
  }, [districts]);

  const current = staged.find((d) => d.district.code === selected) ?? staged[0];
  const d = current.district;
  const outlinePath = useMemo(
    () =>
      outline
        .map(
          ([lon, lat], i) =>
            `${i ? "L" : "M"}${project(lon, lat)
              .map((n) => n.toFixed(1))
              .join(" ")}`,
        )
        .join("") + "Z",
    [outline],
  );
  const isDefault =
    thresholds.watchAnomalyMm === DEFAULT_THRESHOLDS.watchAnomalyMm &&
    thresholds.alertDrySpellDays === DEFAULT_THRESHOLDS.alertDrySpellDays;

  function openMatrix() {
    setStage(current.stage);
    router.push("/matrix");
  }

  return (
    <div className="explorer">
      <div className="map">
        <div className="slider" style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="district-select">District</label>
          <select
            id="district-select"
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
            style={{
              font: "inherit",
              padding: "0.45rem 0.6rem",
              borderRadius: 8,
              border: "1.5px solid var(--line)",
              background: "var(--card)",
            }}
          >
            {staged.map(({ district, stage }) => (
              <option key={district.code} value={district.code}>
                {district.name} (Stage {stage}, {STAGES[stage].name})
              </option>
            ))}
          </select>
        </div>
        <svg
          viewBox={`-8 -8 ${MAP_W + 16} ${MAP_H + 16}`}
          role="group"
          aria-label="Map of Tamil Nadu districts, coloured by forecast reading"
        >
          <path className="map__outline" d={outlinePath} />
          {staged.map(({ district, stage }) => {
            const [cx, cy] = project(district.lon, district.lat);
            const active = district.code === selected;
            return (
              <g
                key={district.code}
                className="map__dot"
                data-s={stage}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={`${district.name}: Stage ${stage}, ${STAGES[stage].name}`}
                onClick={() => setSelected(district.code)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(district.code);
                  }
                }}
                onPointerEnter={() => setHovered(district.code)}
                onPointerLeave={() => setHovered(null)}
              >
                <circle cx={cx} cy={cy} r={active ? 13 : 10} fill={STAGE_FILL[stage]} />
                <text x={cx} y={cy + 0.5}>
                  {stage}
                </text>
              </g>
            );
          })}
          {staged
            .filter(({ district }) => district.code === selected || district.code === hovered)
            .map(({ district }) => {
              const [cx, cy] = project(district.lon, district.lat);
              const left = district.lon > 79.1;
              return (
                <text
                  key={district.code}
                  className="map__name"
                  x={cx + (left ? -17 : 17)}
                  y={cy + 4}
                  textAnchor={left ? "end" : "start"}
                >
                  {district.name}
                </text>
              );
            })}
        </svg>
      </div>

      <div>
        <div className="rule">
          <p className="rule__title">Illustrative trigger rule</p>
          <div className="slider">
            <label htmlFor="watch">
              Watch when the 4-week mean rainfall anomaly is at or below
              <output htmlFor="watch">{signed(thresholds.watchAnomalyMm, 0)} mm a week</output>
            </label>
            <input
              id="watch"
              type="range"
              {...THRESHOLD_RANGE.watchAnomalyMm}
              value={thresholds.watchAnomalyMm}
              onChange={(e) => setThresholds((t) => ({ ...t, watchAnomalyMm: Number(e.target.value) }))}
            />
          </div>
          <div className="slider">
            <label htmlFor="alert">
              Alert when a district on Watch also has a dry run of at least
              <output htmlFor="alert">{thresholds.alertDrySpellDays} days in the next 10</output>
            </label>
            <input
              id="alert"
              type="range"
              {...THRESHOLD_RANGE.alertDrySpellDays}
              value={thresholds.alertDrySpellDays}
              onChange={(e) => setThresholds((t) => ({ ...t, alertDrySpellDays: Number(e.target.value) }))}
            />
          </div>
          <div
            className="tally"
            role="img"
            aria-label={`${counts[0]} districts Normal, ${counts[1]} Watch, ${counts[2]} Alert`}
          >
            {counts.map((n, s) => (
              <span key={s} style={{ flexGrow: n, flexBasis: 0, background: STAGE_FILL[s] }}>
                {n > 0 ? n : ""}
              </span>
            ))}
          </div>
          <div className="tally__key">
            {counts.map((n, s) => (
              <span key={s}>
                <span className="pip" data-s={s}>
                  {s}
                </span>
                {n} {STAGES[s].name}
              </span>
            ))}
            {!isDefault && (
              <button type="button" className="reset" onClick={() => setThresholds(DEFAULT_THRESHOLDS)}>
                Reset thresholds
              </button>
            )}
          </div>
          <p className="small muted">
            Severe is never read from a forecast: it needs an observed, sustained deficit. Real thresholds are to be set
            with TNSDMA, TNDRRA, TNAU and ICAR-CRIDA.
          </p>
        </div>

        <div className="detail" aria-live="polite">
          <div className="detail__head">
            <span
              className="pip"
              data-s={current.stage}
              style={{ width: "1.9rem", height: "1.9rem", fontSize: "1rem" }}
            >
              {current.stage}
            </span>
            <h3 className="h3">
              {d.name} reads {STAGES[current.stage].name}
            </h3>
          </div>
          <ul className="detail__why">
            <li>
              Rainfall over the next four weeks averages <b className="num">{signed(current.mean)} mm a week</b> against
              normal (Watch line {signed(thresholds.watchAnomalyMm, 0)}).
            </li>
            <li>
              Longest dry run in the next 10 days: <b className="num">{d.drySpellDays} days</b> (Alert line{" "}
              {thresholds.alertDrySpellDays}).
            </li>
          </ul>
          <WeekBars
            anomalies={d.anomalyMm}
            weeks={weeks}
            drierPct={d.drierPct}
            threshold={thresholds.watchAnomalyMm}
            label={`Weekly rainfall anomaly forecast for ${d.name}, six weeks ahead, in millimetres against normal`}
          />
          <div className="stats">
            <div className="stat">
              <span className="stat__value num">{d.dryChancePct.join(" / ")}%</span>
              <span className="stat__label">Chance of below-normal rain in weeks 2, 3 and 4 (IRI SubX)</span>
            </div>
            <div className="stat">
              <span className="stat__value num">{d.rain7dMm.toFixed(0)} mm</span>
              <span className="stat__label">Rain forecast for the next 7 days</span>
            </div>
            <div className="stat">
              <span className="stat__value num">{d.tmaxC.toFixed(1)} °C</span>
              <span className="stat__label">Hottest day in the next 10</span>
            </div>
          </div>
          <button type="button" className="button" onClick={openMatrix}>
            Open the matrix at Stage {current.stage}, {STAGES[current.stage].name}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Pure functions that turn raw ENSO Outlook API responses into the app's
 * `Signal` shape. Kept free of fetch and Next.js so they can be unit-tested
 * (see scripts/normalise.test.mjs) and reused by the snapshot script.
 *
 * Every function throws on a shape it does not recognise; the client catches
 * that and falls back to the snapshot for that section only.
 */
import type { DailyForecast, DatedValue, EnsoEvent, EnsoPhase, ProbabilityWindow, S2SWeek } from "./types";

type Json = Record<string, any>;

const num = (v: unknown, what: string): number => {
  if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`${what}: expected a number`);
  return v;
};

const list = <T>(v: unknown, what: string): T[] => {
  if (!Array.isArray(v) || v.length === 0) throw new Error(`${what}: expected a non-empty list`);
  return v as T[];
};

/** GET /enso/current-phase */
export function phase(raw: Json): EnsoPhase {
  return {
    label: String(raw.phase_label),
    code: String(raw.phase_code),
    roni: num(raw.value, "phase.value"),
    season: String(raw.season),
    month: String(raw.date),
  };
}

/** GET /enso/oni-historical → monthly RONI in tenths of a degree */
export function roniHistory(raw: Json): { start: string; tenths: number[] } {
  const rows = list<Json>(raw.data, "oni-historical.data");
  return {
    start: String(rows[0].date),
    tenths: rows.map((r) => Math.round(num(r.oni, "oni") * 10)),
  };
}

/** GET /enso/events → El Niño events only */
export function events(raw: Json): EnsoEvent[] {
  return list<Json>(raw.events, "events")
    .filter((e) => e.phase === "el_nino")
    .map((e) => ({
      name: String(e.name),
      peak: num(e.peak_oni, "event.peak_oni"),
      peakMonth: String(e.peak_date),
      months: num(e.duration_months, "event.duration_months"),
      strength: String(e.strength),
    }));
}

/** GET /dashboard/outlook → probability_windows */
export function probabilities(raw: Json): { windows: ProbabilityWindow[]; release: string } {
  const rows = list<Json>(raw.probability_windows, "probability_windows");
  const first = rows[0];
  const source = typeof first.source === "string" ? first.source.toUpperCase() : "";
  return {
    windows: rows.map((w) => ({
      season: String(w.season_label),
      months: String(w.months_label ?? w.season_label),
      elNino: num(w.el_nino, "el_nino"),
      neutral: num(w.neutral, "neutral"),
      laNina: num(w.la_nina, "la_nina"),
      strongPlus: num(w.strong_plus, "strong_plus"),
    })),
    release: [source, first.release].filter(Boolean).join(", "),
  };
}

/** GET /enso/soi → latest value and monthly means of the 30-day index */
export function soi(raw: Json): {
  latest: DatedValue;
  monthly: DatedValue[];
  elNinoBelow: number;
  laNinaAbove: number;
} {
  const labels = list<string>(raw.labels, "soi.labels");
  const values = list<number>(raw.values, "soi.values");
  const byMonth = new Map<string, number[]>();
  labels.forEach((label, i) => {
    const key = label.slice(0, 7);
    const bucket = byMonth.get(key) ?? [];
    bucket.push(values[i]);
    byMonth.set(key, bucket);
  });
  const monthly = [...byMonth.entries()].slice(-14).map(([date, v]) => ({
    date,
    value: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10,
  }));
  return {
    latest: { date: labels[labels.length - 1], value: num(values[values.length - 1], "soi.latest") },
    monthly,
    elNinoBelow: raw.method?.thresholds?.el_nino ?? -7,
    laNinaAbove: raw.method?.thresholds?.la_nina ?? 7,
  };
}

/** GET /enso/iod → last 30 weekly values */
export function iod(raw: Json): { weekly: DatedValue[]; positiveAbove: number; negativeBelow: number } {
  const labels = list<string>(raw.labels, "iod.labels");
  const values = list<number>(raw.values, "iod.values");
  const weekly = labels.slice(-30).map((date, i) => ({
    date,
    value: num(values.slice(-30)[i], "iod.value"),
  }));
  return {
    weekly,
    positiveAbove: raw.method?.thresholds?.positive ?? 0.4,
    negativeBelow: raw.method?.thresholds?.negative ?? -0.4,
  };
}

/** GET /dashboard/outlook (global) → headline exposure */
export function globalExposure(raw: Json) {
  const k = raw.kpis;
  return {
    peopleAtRisk: num(k.people_at_risk_M.value, "people_at_risk"),
    croplandAtRiskMha: num(k.cropland_at_risk_Mha.value, "cropland_at_risk"),
    croplandTotalMha: num(k.cropland_at_risk_Mha.total_value, "cropland_total"),
    period: String(k.people_at_risk_M.period_label)
      .replace(/-/g, "–")
      .replace(/^(\w+)–\w+–(\w+)$/, "$1–$2"),
  };
}

/** GET /dashboard/outlook?iso3=IND → cropland by forecast class */
export function indiaExposure(raw: Json) {
  const c = raw.kpis.cropland_at_risk_Mha;
  return {
    croplandBelowNormalMha: num(c.value, "india.cropland.value"),
    croplandAboveNormalMha: num(c.above_value, "india.cropland.above"),
    croplandTotalMha: num(c.total_value, "india.cropland.total"),
    period: String(raw.kpis.people_at_risk_M.period_label)
      .replace(/-/g, "–")
      .replace(/^(\w+)–\w+–(\w+)$/, "$1–$2"),
    issued: String(c.issued),
  };
}

/** GET /forecasts/s2s-anomaly/admin-series → weekly rainfall anomaly */
export function s2sSeries(raw: Json): { issued: string; weeks: S2SWeek[] } {
  return {
    issued: String(raw.init_date),
    weeks: list<Json>(raw.series, "s2s.series").map((w) => ({
      from: String(w.valid_from),
      to: String(w.valid_to),
      anomalyMm: num(w.anomaly_mm, "s2s.anomaly_mm"),
      shareSignificant: num(w.pct_significant, "s2s.pct_significant"),
      shareDrier: num(w.pct_drier, "s2s.pct_drier"),
      shareWetter: num(w.pct_wetter, "s2s.pct_wetter"),
    })),
  };
}

/** GET /forecasts/gefs/admin-series → daily rain and temperature */
export function gefsSeries(raw: Json): { issued: string; daily: DailyForecast[] } {
  const iso = (d: string) => (d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d);
  return {
    issued: iso(String(raw.issue_date)),
    daily: list<Json>(raw.series, "gefs.series").map((d) => ({
      date: iso(String(d.date)),
      rainMm: num(d.rain_mm, "gefs.rain_mm"),
      tempC: num(d.tair_c, "gefs.tair_c"),
    })),
  };
}

/** GET /dashboard/agro-advisory → the short-range and weeks 2–4 state for one district */
export function districtAdvisory(raw: Json) {
  const state = raw.state;
  const weeks = list<Json>(state.subseasonal.weeks, "advisory.subseasonal.weeks");
  return {
    dryChancePct: weeks.map((w) => Math.round(num(w.prob_dry, "prob_dry") * 100)),
    rain7dMm: num(state.shortterm.rain_7d_mm, "rain_7d_mm"),
    drySpellDays: num(state.shortterm.dry_spell_days, "dry_spell_days"),
    tmaxC: num(state.shortterm.tmax_max, "tmax_max"),
  };
}

/** GET /dashboard/country-brief?iso3=IND → Tamil Nadu baseline water stress */
export function tamilNaduWaterStress(raw: Json) {
  const features = list<Json>(raw.water_admin1_choropleth.features, "water_admin1_choropleth");
  const tn = features.find((f) => /tamil\s*nadu/i.test(String(f.name_1)));
  if (!tn) throw new Error("Tamil Nadu not found in water stress layer");
  return {
    waterStressScore: num(tn.score, "water.score"),
    waterStressHighShare: num(tn.pct_high, "water.pct_high"),
  };
}

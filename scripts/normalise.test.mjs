/**
 * Checks the ENSO Outlook normalisers against trimmed copies of real
 * responses (captured 17 November 2026). Run with: npm test
 * Node 22.18+ loads the TypeScript source directly.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import * as n from "../src/lib/enso/normalise.ts";

test("current phase", () => {
  const out = n.phase({ value: 2, date: "2026-09", season: "ASO", phase_code: "SE", phase_label: "Strong El Niño" });
  assert.deepEqual(out, { label: "Strong El Niño", code: "SE", roni: 2, season: "ASO", month: "2026-09" });
});

test("history is stored in tenths of a degree", () => {
  const out = n.roniHistory({
    data: [
      { date: "1950-01", oni: -1.2 },
      { date: "1950-02", oni: -1.1 },
      { date: "2026-09", oni: 2 },
    ],
  });
  assert.equal(out.start, "1950-01");
  assert.deepEqual(out.tenths, [-12, -11, 20]);
});

test("events keep El Niño only", () => {
  const out = n.events({
    events: [
      { name: "1950", phase: "la_nina", peak_oni: -1.2, peak_date: "1950-01", duration_months: 6, strength: "Moderate" },
      { name: "1997–98", phase: "el_nino", peak_oni: 2.3, peak_date: "1997-11", duration_months: 13, strength: "Super" },
    ],
  });
  assert.deepEqual(out, [{ name: "1997–98", peak: 2.3, peakMonth: "1997-11", months: 13, strength: "Super" }]);
});

test("probability windows", () => {
  const out = n.probabilities({
    probability_windows: [
      { season_label: "MAM 2027", months_label: "Mar–May 2027", el_nino: 1, neutral: 0, la_nina: 0, strong_plus: 0.618, source: "iri", release: "mid-October 2026" },
    ],
  });
  assert.equal(out.release, "IRI, mid-October 2026");
  assert.deepEqual(out.windows[0], { season: "MAM 2027", months: "Mar–May 2027", elNino: 1, neutral: 0, laNina: 0, strongPlus: 0.618 });
});

test("SOI gives the latest value and monthly means", () => {
  const out = n.soi({
    labels: ["2026-10-30", "2026-10-31", "2026-11-13", "2026-11-14"],
    values: [-18, -20, -14.9, -12.7],
    method: { thresholds: { el_nino: -7, la_nina: 7 } },
  });
  assert.deepEqual(out.latest, { date: "2026-11-14", value: -12.7 });
  assert.deepEqual(out.monthly, [
    { date: "2026-10", value: -19 },
    { date: "2026-11", value: -13.8 },
  ]);
  assert.equal(out.elNinoBelow, -7);
});

test("IOD keeps the most recent weeks", () => {
  const out = n.iod({ labels: ["2026-11-01", "2026-11-08"], values: [0.73, 0.75], method: { thresholds: { negative: -0.4, positive: 0.4 } } });
  assert.deepEqual(out.weekly[1], { date: "2026-11-08", value: 0.75 });
  assert.equal(out.positiveAbove, 0.4);
});

test("exposure headline figures", () => {
  const raw = {
    kpis: {
      people_at_risk_M: { value: 0, period_label: "Nov-Dec-Jan", total_population: 1475745767 },
      cropland_at_risk_Mha: { value: 0, above_value: 3.5, total_value: 69.7, issued: "Oct 2026", lead: 1 },
    },
  };
  assert.deepEqual(n.indiaExposure(raw), {
    croplandBelowNormalMha: 0,
    croplandAboveNormalMha: 3.5,
    croplandTotalMha: 69.7,
    period: "Nov–Jan",
    issued: "Oct 2026",
  });
  assert.equal(n.globalExposure(raw).period, "Nov–Jan");
});

test("sub-seasonal weekly series", () => {
  const out = n.s2sSeries({
    init_date: "2026-11-14",
    series: [{ week: 1, valid_from: "2026-11-16", valid_to: "2026-11-23", anomaly_mm: -26.23, pct_significant: 1, pct_drier: 0.8008, pct_wetter: 0 }],
  });
  assert.equal(out.issued, "2026-11-14");
  assert.deepEqual(out.weeks[0], { from: "2026-11-16", to: "2026-11-23", anomalyMm: -26.23, shareSignificant: 1, shareDrier: 0.8008, shareWetter: 0 });
});

test("GEFS daily series turns compact dates into ISO dates", () => {
  const out = n.gefsSeries({ issue_date: "20261116", series: [{ lead: 0, date: "20261116", rain_mm: 0.17, tair_c: 25.67 }] });
  assert.equal(out.issued, "2026-11-16");
  assert.deepEqual(out.daily[0], { date: "2026-11-16", rainMm: 0.17, tempC: 25.67 });
});

test("district advisory state", () => {
  const out = n.districtAdvisory({
    state: {
      subseasonal: { weeks: [{ week: 2, prob_wet: 0.333, prob_dry: 0.507 }, { week: 3, prob_wet: 0.333, prob_dry: 0.449 }, { week: 4, prob_wet: 0.333, prob_dry: 0.39 }] },
      shortterm: { rain_7d_mm: 8.2, dry_spell_days: 6, tmax_max: 32.5 },
    },
  });
  assert.deepEqual(out, { dryChancePct: [51, 45, 39], rain7dMm: 8.2, drySpellDays: 6, tmaxC: 32.5 });
});

test("Tamil Nadu water stress", () => {
  const out = n.tamilNaduWaterStress({
    water_admin1_choropleth: { features: [{ name_1: "Kerala", score: 2.876, pct_high: 0.2 }, { name_1: "Tamil Nadu", score: 4.005, pct_high: 0.7699 }] },
  });
  assert.deepEqual(out, { waterStressScore: 4.005, waterStressHighShare: 0.7699 });
});

test("an unexpected shape throws, so the client can fall back", () => {
  assert.throws(() => n.s2sSeries({ init_date: "2026-11-14", series: [] }));
  assert.throws(() => n.phase({ value: "n/a" }));
});

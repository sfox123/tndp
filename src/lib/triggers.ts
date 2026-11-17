/**
 * Illustrative trigger rule.
 *
 * The framework's real triggers come from TN-DEWS (VIC soil moisture, SPI,
 * Earth observation) and their thresholds are still to be set with TNSDMA,
 * TNDRRA, TNAU and ICAR-CRIDA. Until then this file reads a stage from the
 * forecast variables the ENSO Outlook already publishes for each district,
 * so the matrix can be walked through with real numbers.
 *
 * Change the defaults here, or move the sliders on the Climate signal page.
 */
import type { District } from "./enso/types";

export type Stage = 0 | 1 | 2 | 3;

export type Thresholds = {
  /** Watch when the mean weekly rainfall anomaly over weeks 1–4 is at or below this (mm/week). */
  watchAnomalyMm: number;
  /** Alert when a district on Watch also has a dry run this long in the next 10 days. */
  alertDrySpellDays: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  watchAnomalyMm: -10,
  alertDrySpellDays: 5,
};

export const THRESHOLD_RANGE = {
  watchAnomalyMm: { min: -30, max: -5, step: 1 },
  alertDrySpellDays: { min: 2, max: 8, step: 1 },
} as const;

export function meanAnomaly(district: District, weeks = 4): number {
  const slice = district.anomalyMm.slice(0, weeks);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

/**
 * Stage 3 (Severe) is never read from a forecast: it needs an observed,
 * sustained deficit through flowering and grain filling, which only TN-DEWS
 * monitoring can confirm.
 */
export function stageFor(district: District, t: Thresholds = DEFAULT_THRESHOLDS): Exclude<Stage, 3> {
  if (meanAnomaly(district) > t.watchAnomalyMm) return 0;
  if (district.drySpellDays >= t.alertDrySpellDays) return 2;
  return 1;
}

export function countByStage(districts: District[], t: Thresholds = DEFAULT_THRESHOLDS) {
  const counts: [number, number, number] = [0, 0, 0];
  for (const d of districts) counts[stageFor(d, t)]++;
  return counts;
}

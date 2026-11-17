/**
 * Normalised shape of everything the app reads from the IWMI ENSO Outlook
 * (https://enso.iwmi.org). The live client and the bundled snapshot both
 * produce this shape, so components never see raw API responses.
 */

export type EnsoPhase = {
  label: string; // e.g. "Strong El Niño"
  code: string; // e.g. "SE"
  roni: number; // latest Relative Oceanic Niño Index, °C
  season: string; // e.g. "ASO"
  month: string; // centre month, YYYY-MM
};

export type ProbabilityWindow = {
  season: string; // "OND 2026"
  months: string; // "Oct–Dec 2026"
  elNino: number; // 0–1
  neutral: number;
  laNina: number;
  strongPlus: number; // chance of a strong or stronger El Niño
};

export type EnsoEvent = {
  name: string; // "1997–98"
  peak: number;
  peakMonth: string; // YYYY-MM
  months: number;
  strength: string;
};

export type DatedValue = { date: string; value: number };

export type S2SWeek = {
  from: string; // ISO date
  to: string;
  anomalyMm: number; // mm/week against the model's reforecast climatology
  shareSignificant: number; // 0–1 area share significantly different from normal
  shareDrier: number; // 0–1 area share significantly drier (beyond −10 mm/week)
  shareWetter: number;
};

export type DailyForecast = { date: string; rainMm: number; tempC: number };

export type District = {
  code: number; // FAO GAUL district code used by the ENSO Outlook API
  name: string;
  lon: number;
  lat: number;
  /** ECMWF sub-seasonal weekly rainfall anomaly, weeks 1–6, mm/week */
  anomalyMm: number[];
  /** Area share (0–100) significantly drier than normal, weeks 1–6 */
  drierPct: number[];
  /** IRI SubX chance (0–100) of below-normal rain, weeks 2, 3 and 4 */
  dryChancePct: number[];
  rain7dMm: number; // forecast rain, next 7 days
  drySpellDays: number; // longest dry run in the next 10 days
  tmaxC: number; // hottest day in the next 10 days
};

export type Signal = {
  source: "live" | "snapshot";
  /** When the figures were read from the ENSO Outlook API (ISO date-time) */
  fetchedAt: string;
  enso: EnsoPhase;
  /** Monthly RONI since January 1950, in tenths of a degree */
  roniTenths: number[];
  roniStart: string; // "1950-01"
  events: EnsoEvent[];
  probabilities: ProbabilityWindow[];
  probabilityRelease: string;
  soi: { latest: DatedValue; monthly: DatedValue[]; elNinoBelow: number; laNinaAbove: number };
  iod: { weekly: DatedValue[]; positiveAbove: number; negativeBelow: number };
  global: { peopleAtRisk: number; croplandAtRiskMha: number; croplandTotalMha: number; period: string };
  india: {
    croplandBelowNormalMha: number;
    croplandAboveNormalMha: number;
    croplandTotalMha: number;
    period: string;
    issued: string;
  };
  tamilNadu: {
    waterStressScore: number;
    waterStressHighShare: number; // 0–1
    s2sIssued: string;
    weeks: S2SWeek[];
    gefsIssued: string;
    daily: DailyForecast[];
    districts: District[];
  };
};

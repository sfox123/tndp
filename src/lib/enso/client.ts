/**
 * Server-side reader for the IWMI ENSO Outlook API.
 *
 * Design:
 *  - All requests run on the server, so the browser never talks to the API
 *    directly (no CORS dependency, one place to cache).
 *  - Responses are cached by Next.js and revalidated every six hours.
 *  - A quick probe decides live versus snapshot. If the probe fails, the
 *    bundled snapshot is returned at once, so builds and offline demos work.
 *  - Each section falls back to the snapshot on its own, so one changed
 *    endpoint does not blank the page.
 *
 * Environment:
 *    ENSO_API_BASE   override the API root
 *    ENSO_LIVE=0     always serve the snapshot
 */
import { cache } from "react";
import * as normalise from "./normalise";
import { snapshot } from "./snapshot";
import type { District, Signal } from "./types";

const BASE = process.env.ENSO_API_BASE ?? "https://enso.iwmi.org/ENSO_api/api/v1";
export const REVALIDATE_SECONDS = 6 * 60 * 60;
const TIMEOUT_MS = 8000;
const TAMIL_NADU = "Tamil Nadu";

async function get(path: string): Promise<Record<string, any>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json();
}

/** Run `fn`; on any failure log once and return the snapshot value instead. */
async function section<T>(name: string, fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn(`[enso] ${name}: using snapshot (${(error as Error).message})`);
    return fallback;
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

async function liveDistrict(base: District): Promise<District> {
  const q = `iso3=IND&admin_code=${base.code}&level=2`;
  const [s2s, advisory] = await Promise.all([
    section(`s2s ${base.name}`, null, async () =>
      normalise.s2sSeries(await get(`/forecasts/s2s-anomaly/admin-series?${q}`)),
    ),
    section(`advisory ${base.name}`, null, async () =>
      normalise.districtAdvisory(
        await get(`/dashboard/agro-advisory?iso3=IND&crop=other_cereals&district=${base.code}`),
      ),
    ),
  ]);
  return {
    ...base,
    ...(s2s && {
      anomalyMm: s2s.weeks.map((w) => w.anomalyMm),
      drierPct: s2s.weeks.map((w) => Math.round(w.shareDrier * 100)),
    }),
    ...(advisory ?? {}),
  };
}

async function loadLive(): Promise<Signal> {
  // Probe first: if the API cannot be reached, fail fast and use the snapshot.
  const enso = normalise.phase(await get("/enso/current-phase"));
  const s = snapshot;
  const admin = `iso3=IND&admin_name=${encodeURIComponent(TAMIL_NADU)}`;

  const [history, eventList, outlook, india, soi, iod, water, s2s, gefs, districts] = await Promise.all([
    section("history", { start: s.roniStart, tenths: s.roniTenths }, async () =>
      normalise.roniHistory(await get("/enso/oni-historical")),
    ),
    section("events", s.events, async () => normalise.events(await get("/enso/events"))),
    section(
      "outlook",
      { probabilities: { windows: s.probabilities, release: s.probabilityRelease }, global: s.global },
      async () => {
        const raw = await get("/dashboard/outlook");
        return { probabilities: normalise.probabilities(raw), global: normalise.globalExposure(raw) };
      },
    ),
    section("india", s.india, async () => normalise.indiaExposure(await get("/dashboard/outlook?iso3=IND"))),
    section("soi", s.soi, async () => normalise.soi(await get("/enso/soi"))),
    section("iod", s.iod, async () => normalise.iod(await get("/enso/iod"))),
    section(
      "water stress",
      { waterStressScore: s.tamilNadu.waterStressScore, waterStressHighShare: s.tamilNadu.waterStressHighShare },
      async () => normalise.tamilNaduWaterStress(await get("/dashboard/country-brief?iso3=IND")),
    ),
    section("tamil nadu s2s", { issued: s.tamilNadu.s2sIssued, weeks: s.tamilNadu.weeks }, async () =>
      normalise.s2sSeries(await get(`/forecasts/s2s-anomaly/admin-series?${admin}`)),
    ),
    section("tamil nadu gefs", { issued: s.tamilNadu.gefsIssued, daily: s.tamilNadu.daily }, async () =>
      normalise.gefsSeries(await get(`/forecasts/gefs/admin-series?${admin}`)),
    ),
    mapLimit(s.tamilNadu.districts, 4, liveDistrict),
  ]);

  return {
    source: "live",
    fetchedAt: new Date().toISOString(),
    enso,
    roniTenths: history.tenths,
    roniStart: history.start,
    events: eventList,
    probabilities: outlook.probabilities.windows,
    probabilityRelease: outlook.probabilities.release,
    soi,
    iod,
    global: outlook.global,
    india,
    tamilNadu: {
      ...water,
      s2sIssued: s2s.issued,
      weeks: s2s.weeks,
      gefsIssued: gefs.issued,
      daily: gefs.daily,
      districts,
    },
  };
}

/**
 * The one entry point pages use. Deduplicated per request with React's cache;
 * the underlying fetches are cached across requests by Next.js.
 */
export const getSignal = cache(async (): Promise<Signal> => {
  if (process.env.ENSO_LIVE === "0") return snapshot;
  try {
    return await loadLive();
  } catch (error) {
    console.warn(`[enso] API not reachable, serving the bundled snapshot (${(error as Error).message})`);
    return snapshot;
  }
});

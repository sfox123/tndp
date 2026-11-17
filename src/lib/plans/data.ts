/**
 * Reads the Tamil Nadu District Agriculture Contingency Plans from the SukhaRakshak
 * contingency plan portal's database (Supabase), read-only.
 *
 * The portal stays the place where plans are edited and approved. This site only shows
 * the published text, so an approved edit in the portal appears here within an hour.
 *
 * Runs on the server only: the service role key never reaches the browser.
 *
 * Environment (in .env, the same values the portal uses):
 *    NEXT_PUBLIC_SUPABASE_URL
 *    SUPABASE_SERVICE_ROLE_KEY
 */
import 'server-only';
import { categorize } from './categories';
import { compareHeaders } from './format';

export const STATE = 'Tamil Nadu';
const REVALIDATE_SECONDS = 60 * 60;
const TIMEOUT_MS = 15_000;
const PAGE = 1000;

export interface PlanSection {
  id: string;
  header: string | null;
  body: string;
  version: number;
  updated_at: string;
  topic: string;
}

export interface DistrictSummary {
  district: string;
  sections: number;
  lastUpdated: string;
}

/** Thrown when the plans cannot be read; the message is safe to show on the page. */
export class PlansUnavailable extends Error {}

async function rest<T>(query: string): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new PlansUnavailable('The plan database is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  }
  let res: Response;
  try {
    res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS, tags: ['plans'] },
    });
  } catch (error) {
    throw new PlansUnavailable(`The plan database could not be reached (${(error as Error).message}).`);
  }
  if (!res.ok) throw new PlansUnavailable(`The plan database returned ${res.status}.`);
  return res.json() as Promise<T>;
}

const stateFilter = `state=eq.${encodeURIComponent(STATE)}&is_deleted=eq.false`;

/** Every Tamil Nadu district that has a plan, with its section count. */
export async function getDistricts(): Promise<DistrictSummary[]> {
  const map = new Map<string, DistrictSummary>();
  for (let offset = 0; ; offset += PAGE) {
    const rows = await rest<{ district: string; updated_at: string }[]>(
      `sections?select=district,updated_at&${stateFilter}&order=id&limit=${PAGE}&offset=${offset}`,
    );
    for (const r of rows) {
      const cur = map.get(r.district);
      if (!cur) map.set(r.district, { district: r.district, sections: 1, lastUpdated: r.updated_at });
      else {
        cur.sections++;
        if (r.updated_at > cur.lastUpdated) cur.lastUpdated = r.updated_at;
      }
    }
    if (rows.length < PAGE) break;
  }
  return [...map.values()].sort((a, b) => a.district.localeCompare(b.district));
}

/** One district's sections in reading order, each sorted into a topic the way the portal does it. */
export async function getDistrictPlan(district: string): Promise<PlanSection[]> {
  const rows = await rest<Omit<PlanSection, 'topic'>[]>(
    `sections?select=id,header,body,version,updated_at&${stateFilter}` +
      `&district=eq.${encodeURIComponent(district)}&order=header.asc.nullslast,id.asc&limit=${PAGE}`,
  );
  return rows.sort((a, b) => compareHeaders(a.header, b.header)).map((s) => ({ ...s, topic: categorize(s) }));
}

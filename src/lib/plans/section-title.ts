// Copied from sukharakshak-portal/lib/section-title.ts so titles match the portal. Keep the two in step.
// About 3,000 imported sections are headed just "Condition" (or "Suggested contingency measures"): in the
// original plans the condition itself sat in the first cells of the table. For those, a title is worked out
// from the table so a district page doesn't read "Condition, Condition, Condition…".
// Only the displayed title changes; the stored header is never touched (the chatbot reads it).

const GENERIC = /^(conditions?|suggested contingency measures?|contingency measures?|untitled section)$/i;

// Each rule names a condition. When several match, the one that appears first in the table wins.
const RULES: [RegExp, string][] = [
  [/early[\s-]*season|delay(?:ed)?\s*by\s*\d+\s*weeks?|(?:delayed|normal)\s*onset/i, 'early'],
  [/mid[\s-]*season/i, 'Mid-season drought'],
  [/terminal|early withdrawal of monsoon/i, 'Terminal drought'],
  [/delay(?:ed)?\b[^|]{0,30}release of (?:canal )?water|delay in release of water/i, 'Delayed release of canal water'],
  [/limited release of (?:canal )?water/i, 'Limited release of canal water'],
  [/non[\s-]*release of (?:canal )?water/i, 'No release of canal water'],
  [/release of (?:canal )?water in canals?/i, 'Shortage of canal water'],
  [/lack of inflows?/i, 'Lack of inflows into tanks'],
  [/insufficient(?:ly)?\s*ground\s?water|ground\s?water recharge|recharge due to low rain/i, 'Insufficient groundwater recharge'],
  [/insufficiency of surface water/i, 'Shortage of surface water'],
  [/continuous high rainfall/i, 'Continuous high rainfall'],
  [/heavy rainfall with high speed winds?/i, 'Heavy rain with high-speed winds'],
  [/outbreak of pests?/i, 'Pest and disease outbreak after unseasonal rain'],
  [/transient water\s?logging|partial inundation/i, 'Waterlogging / partial inundation'],
  [/continuous submergence/i, 'Continuous submergence'],
  [/sea water intrusion/i, 'Sea water intrusion'],
  [/heat\s?wave/i, 'Heat wave'],
  [/cold\s?wave/i, 'Cold wave'],
  [/\bfrost\b/i, 'Frost'],
  [/hail\s?storm/i, 'Hailstorm'],
  [/cyclone/i, 'Cyclone'],
  [/any other condition/i, 'Any other condition'],
  [/vegetative stage[\s\S]{0,200}flowering stage/i, 'Measures by crop stage'],
];

function plainText(body: string): string {
  return body
    .slice(0, 4000)
    .split(/<\/?(?:td|th|tr|p|br|li)[^>]*>|\n/)
    .map(x => x.replace(/<[^>]+>/g, '').replace(/&#x26;|&amp;/g, '&').replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' | ');
}

// Adds the one detail that tells sibling sections apart, when the table names exactly one.
function only(text: string, re: RegExp): string | null {
  const found = new Set([...text.matchAll(re)].map(m => m[1].toLowerCase()));
  return found.size === 1 ? [...found][0] : null;
}

function earlySeason(text: string): string {
  const weeks = only(text, /delay(?:ed)?\s*(?:by\s*)?(\d+)\s*weeks?/gi);
  if (weeks) return `Early season drought · monsoon delayed by ${weeks} weeks`;
  if (/delayed\s*onset/i.test(text)) return 'Early season drought · delayed monsoon';
  if (/normal\s*onset/i.test(text)) return 'Early season drought · normal onset, then a dry spell';
  return 'Early season drought';
}

function midSeason(text: string): string {
  const stage = only(text, /at\s+(vegetative|flowering|reproductive|grain filling|maturity)\b/gi);
  return stage ? `Mid-season drought · at ${stage} stage` : 'Mid-season drought (long dry spell)';
}

export function derivedTitle(body: string): string | null {
  const text = plainText(body);
  let best: { at: number; label: string } | null = null;
  for (const [re, label] of RULES) {
    const m = re.exec(text);
    if (m && (!best || m.index < best.at)) best = { at: m.index, label };
  }
  if (!best) return null;
  if (best.label === 'early') return earlySeason(text);
  if (best.label === 'Mid-season drought') return midSeason(text);
  return best.label;
}

// The title to show for a section: its own header, unless that header is a generic placeholder.
export function betterTitle(title: string, body: string | null | undefined): string {
  if (!body || !GENERIC.test(title.trim())) return title;
  return derivedTitle(body) ?? 'Contingency measures';
}

// Titles for sections in reading order. The import split long tables across sections, so a generic section
// that names no condition, or names the same one as the section before it, continues that section.
export function titlesInOrder(items: { id: string; title: string; body: string | null }[]): Map<string, string> {
  const out = new Map<string, string>();
  let prev: string | null = null;
  for (const it of items) {
    if (!GENERIC.test(it.title.trim())) {
      out.set(it.id, it.title);
      prev = null;
      continue;
    }
    const own = it.body ? derivedTitle(it.body) : null;
    if (own && own !== prev) {
      out.set(it.id, own);
      prev = own;
    } else {
      out.set(it.id, prev ? `${prev} (continued)` : own ?? 'Contingency measures');
      prev ??= own;
    }
  }
  return out;
}

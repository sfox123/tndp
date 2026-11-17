// Display helpers for contingency-plan sections. The first four are copied from
// sukharakshak-portal/lib/format.ts so headings read the same in both places.

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

// Stored: '# 2.5 Livestock, Poultry &#x26; Fisheries'  →  shown: '2.5 Livestock, Poultry & Fisheries'
export function displayHeader(header: string | null | undefined): string {
  if (header == null) return 'Untitled section';
  const t = decodeEntities(header.replace(/^\s*#+\s*/, '')).trim();
  return t || 'Untitled section';
}

// '2.5 Livestock' → { number: '2.5', title: 'Livestock' }; no leading number → number null
export function headerParts(header: string | null | undefined): { number: string | null; title: string } {
  const t = displayHeader(header);
  const m = t.match(/^(\d+(?:\.\d+)*)[.)]?\s+(.*)$/);
  return m ? { number: m[1], title: m[2] } : { number: null, title: t };
}

// Natural order of section numbers: 1.1 < 1.2 < 1.10 < 2.1; sections without a number go last.
export function compareHeaders(a: string | null, b: string | null): number {
  const ka = headerParts(a).number?.split('.').map(Number) ?? null;
  const kb = headerParts(b).number?.split('.').map(Number) ?? null;
  if (ka && !kb) return -1;
  if (!ka && kb) return 1;
  if (ka && kb) {
    for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
      const d = (ka[i] ?? -1) - (kb[i] ?? -1);
      if (d) return d;
    }
  }
  return 0; // keep the incoming (stable) order
}

// District names are stored in capitals ('THIRUNELVELI'); show them as 'Thirunelveli'.
export function districtName(stored: string): string {
  return stored.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase());
}

export const districtHref = (district: string) => `/plans/${encodeURIComponent(district)}`;

const DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
export const fmtDate = (d: string | null | undefined) => (d ? DATE.format(new Date(d)) : '—');

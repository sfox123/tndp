// Section bodies are line-oriented text with HTML <table> blocks in between.
// Copied from sukharakshak-portal/lib/body.ts (the read-only parts). No DOM needed.
import { parse, NodeType, type HTMLElement, type Node } from 'node-html-parser';
import { decodeEntities } from './format';

export type Segment = { type: 'text' | 'table'; raw: string };

const TABLE_RE = /<table\b[\s\S]*?<\/table\s*>/gi;

export function splitBody(body: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of body.matchAll(TABLE_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ type: 'text', raw: body.slice(last, i) });
    out.push({ type: 'table', raw: m[0] });
    last = i + m[0].length;
  }
  if (last < body.length) out.push({ type: 'text', raw: body.slice(last) });
  return out;
}

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'br' }
  | { t: 'mark'; tag: 'strong' | 'em' | 's' | 'sub' | 'sup'; children: Inline[] };

export interface Cell {
  header: boolean;
  colspan: number;
  rowspan: number;
  content: Inline[];
  text: string; // plain text, used for search
}
export type TableRows = Cell[][];

const MARKS: Record<string, 'strong' | 'em' | 's' | 'sub' | 'sup'> = {
  strong: 'strong', b: 'strong', em: 'em', i: 'em', s: 's', del: 's', strike: 's', sub: 'sub', sup: 'sup',
};

function inline(nodes: Node[]): Inline[] {
  const out: Inline[] = [];
  for (const n of nodes) {
    if (n.nodeType === NodeType.TEXT_NODE) {
      const v = decodeEntities(n.rawText);
      if (v) out.push({ t: 'text', v });
    } else if (n.nodeType === NodeType.ELEMENT_NODE) {
      const el = n as HTMLElement;
      const tag = el.rawTagName?.toLowerCase();
      if (tag === 'br') out.push({ t: 'br' });
      else if (tag && MARKS[tag]) out.push({ t: 'mark', tag: MARKS[tag], children: inline(el.childNodes) });
      else {
        // Unknown wrappers (p, span, div…): keep their text, separate block-like ones with a line break
        if ((tag === 'p' || tag === 'div') && out.length) out.push({ t: 'br' });
        out.push(...inline(el.childNodes));
      }
    }
  }
  return out;
}

const plain = (xs: Inline[]): string =>
  xs.map((x) => (x.t === 'text' ? x.v : x.t === 'br' ? '\n' : plain(x.children))).join('');

const span = (el: HTMLElement, name: string) => Math.max(1, parseInt(el.getAttribute(name) ?? '1', 10) || 1);

export function parseTable(html: string): TableRows {
  const root = parse(html);
  return root.querySelectorAll('tr').map((tr) =>
    tr.childNodes
      .filter(
        (n): n is HTMLElement =>
          n.nodeType === NodeType.ELEMENT_NODE && /^t[hd]$/i.test((n as HTMLElement).rawTagName ?? ''),
      )
      .map((el) => {
        const content = inline(el.childNodes);
        return {
          header: el.rawTagName.toLowerCase() === 'th',
          colspan: span(el, 'colspan'),
          rowspan: span(el, 'rowspan'),
          content,
          text: plain(content).replace(/[ \t]+/g, ' ').trim(),
        };
      }),
  );
}

// Plain text of a whole body (tags removed), for search and topic matching.
export function bodyText(body: string): string {
  return splitBody(body)
    .map((s) => (s.type === 'text' ? s.raw : parseTable(s.raw).map((r) => r.map((c) => c.text).join(' | ')).join('\n')))
    .join('\n');
}

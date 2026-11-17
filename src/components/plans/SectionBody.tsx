import { Fragment, type ReactNode } from "react";
import { parseTable, splitBody, type Inline, type TableRows } from "@/lib/plans/body";
import { decodeEntities } from "@/lib/plans/format";

// Renders a section body the way it reads in the plan: lines of text, sub-headings, bullets and
// bordered tables. Same rules as the portal's components/section-body.tsx. Everything is built as
// React elements; no raw HTML from the database is injected into the page.

function InlineContent({ content }: { content: Inline[] }): ReactNode {
  return content.map((x, i) => {
    if (x.t === "text") return <Fragment key={i}>{x.v}</Fragment>;
    if (x.t === "br") return <br key={i} />;
    const Tag = x.tag;
    return (
      <Tag key={i}>
        <InlineContent content={x.children} />
      </Tag>
    );
  });
}

function TableView({ rows }: { rows: TableRows }) {
  if (!rows.length) return null;
  return (
    <div className="plan-table-wrap">
      <table className="plan-table">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => {
                const Tag = c.header ? "th" : "td";
                return (
                  <Tag
                    key={j}
                    colSpan={c.colspan > 1 ? c.colspan : undefined}
                    rowSpan={c.rowspan > 1 ? c.rowspan : undefined}
                  >
                    <InlineContent content={c.content} />
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BULLET = /^\s*(?:[•●▪◦·‣➢]|[-*+](?=\s))\s*/;
const HEADING = /^\s*#{1,6}\s+/;
const PIPE_ROW = /^\s*\|.*\|\s*$/;
const PIPE_SEP = /^\s*\|?\s*:?-{2,}[\s|:-]*$/;

// **bold** and stray <strong>/<br> in running text
function rich(line: string): ReactNode {
  const text = decodeEntities(
    line.replace(/<\/?(?:strong|b)>/gi, "**").replace(/<\/?(?:em|i|s|u|span|p|div)[^>]*>/gi, ""),
  );
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : <Fragment key={i}>{p}</Fragment>));
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

function TextBlock({ raw }: { raw: string }) {
  const lines = raw.replace(/<br\s*\/?>/gi, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    if (PIPE_ROW.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && PIPE_ROW.test(lines[i])) rows.push(lines[i++]);
      const hasHead = rows.length > 1 && PIPE_SEP.test(rows[1]);
      const body = rows.filter((r) => !PIPE_SEP.test(r));
      out.push(
        <div className="plan-table-wrap" key={out.length}>
          <table className="plan-table">
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>
                  {cells(r).map((c, ci) =>
                    hasHead && ri === 0 ? <th key={ci}>{rich(c)}</th> : <td key={ci}>{rich(c)}</td>,
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (HEADING.test(line)) {
      out.push(
        <div className="sub" key={out.length}>
          {rich(line.replace(HEADING, ""))}
        </div>,
      );
      i++;
      continue;
    }

    if (BULLET.test(line)) {
      const items: string[] = [];
      while (i < lines.length && BULLET.test(lines[i])) items.push(lines[i++].replace(BULLET, ""));
      out.push(
        <ul key={out.length}>
          {items.map((t, k) => (
            <li key={k}>{rich(t)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    out.push(<p key={out.length}>{rich(line)}</p>);
    i++;
  }
  return <>{out}</>;
}

export function SectionBody({ body }: { body: string }) {
  return (
    <div className="plan-body">
      {splitBody(body).map((s, i) =>
        s.type === "table" ? <TableView key={i} rows={parseTable(s.raw)} /> : <TextBlock key={i} raw={s.raw} />,
      )}
    </div>
  );
}

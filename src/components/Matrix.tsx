"use client";

import Link from "next/link";
import { MATRIX, MATRIX_NOTE, STAGES } from "@/lib/content";
import type { Cell } from "@/lib/content";
import type { District } from "@/lib/enso/types";
import { stageFor } from "@/lib/triggers";
import { useStage } from "./StageProvider";

function CellBody({ cell }: { cell: Cell }) {
  return (
    <>
      {cell.text && <p>{cell.text}</p>}
      {cell.actions && (
        <ul className="ticks" style={{ color: "inherit" }}>
          {cell.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
      {cell.pending && <span className="pending">{cell.pending}</span>}
    </>
  );
}

export function Matrix() {
  const { stage, setStage } = useStage();
  return (
    <>
      <div className="matrix" role="table" aria-label="Block-to-village drought contingency matrix">
        <div className="matrix__row matrix__row--head" role="row">
          <span role="columnheader" className="visually-hidden">
            Level
          </span>
          <span aria-hidden="true" />
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="columnheader"
              className="stage-head"
              data-s={s.id}
              aria-pressed={stage === s.id}
              onClick={() => setStage(s.id)}
            >
              <span className="stage-head__num">Stage {s.id}</span>
              <span className="stage-head__name">{s.name}</span>
              <span className="stage-head__phase">{s.phase}</span>
            </button>
          ))}
        </div>
        {MATRIX.map((row) => (
          <div className="matrix__row" role="row" key={row.id}>
            <div className="matrix__label" role="rowheader">
              <b>{row.label}</b>
              <span>{row.who}</span>
            </div>
            {row.cells.map((cell, i) => (
              <div className="cell" role="cell" data-s={i} key={i}>
                <CellBody cell={cell} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="note">{MATRIX_NOTE}</p>
    </>
  );
}

/** Which districts the illustrative rule puts at the selected stage today. */
export function StageReading({ districts }: { districts: District[] }) {
  const { stage } = useStage();
  const s = STAGES[stage];
  const here = districts.filter((d) => stageFor(d) === stage);

  return (
    <section className="reading" aria-live="polite">
      <div>
        <h2 className="h3">Districts reading {s.name} today</h2>
        <p className="small">
          Read from the forecasts the IWMI ENSO Outlook publishes for each district, with an illustrative rule. It shows
          how a live trigger would open this column; it is not a drought declaration.{" "}
          <Link className="link" href="/signal#tamil-nadu">
            See the rule and change its thresholds
          </Link>
        </p>
      </div>
      {stage === 3 ? (
        <p className="reading__empty">
          No district is read as Severe from a forecast. This stage needs an observed, sustained deficit through
          flowering and grain filling, which TN-DEWS monitoring would confirm.
        </p>
      ) : here.length === 0 ? (
        <p className="reading__empty">No district reads {s.name} on the current forecast.</p>
      ) : (
        <ul className="chips">
          {here.map((d) => (
            <li key={d.code}>
              <Link className="chip" href={`/signal?district=${d.code}#tamil-nadu`}>
                <span className="pip" data-s={stage}>
                  {stage}
                </span>
                {d.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

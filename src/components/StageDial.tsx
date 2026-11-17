"use client";

import { STAGES } from "@/lib/content";
import { useStage } from "./StageProvider";

/**
 * The stage selector. `size="compact"` is the header version (numbers only,
 * names read out to assistive tech); the default shows names and phases.
 */
export function StageDial({ size = "full", label = "Drought stage" }: { size?: "full" | "compact"; label?: string }) {
  const { stage, setStage } = useStage();

  return (
    <div className={`dial dial--${size}`} role="radiogroup" aria-label={label}>
      {STAGES.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={stage === s.id}
          className="dial__option"
          data-stage-option={s.id}
          onClick={() => setStage(s.id)}
          title={size === "compact" ? `Stage ${s.id}: ${s.name}` : undefined}
        >
          <span className="dial__num" aria-hidden="true">
            {s.id}
          </span>
          {size === "compact" ? (
            <span className="visually-hidden">
              Stage {s.id}: {s.name}
            </span>
          ) : (
            <span className="dial__text">
              <span className="dial__name">{s.name}</span>
              <span className="dial__phase">{s.phase}</span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** The sentence that describes the scene at the current stage. */
export function StageCaption() {
  const { stage } = useStage();
  const s = STAGES[stage];
  return (
    <p className="stage-caption" aria-live="polite">
      <strong>
        Stage {s.id}, {s.name}.
      </strong>{" "}
      {s.scene}
    </p>
  );
}

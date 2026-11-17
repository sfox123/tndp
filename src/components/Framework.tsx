import { FRAMEWORK_NOTE, TIERS } from "@/lib/content";
import type { Block } from "@/lib/content";
import { AdvisorySample } from "./AdvisorySample";

function TierHead({ step, verb, scale }: { step: number; verb: string; scale: string }) {
  return (
    <div className="tier__head">
      <span className="tier__step" aria-hidden="true">
        {step}
      </span>
      <h3 className="tier__verb">
        <span className="visually-hidden">Step {step}: </span>
        {verb}
      </h3>
      <span className="tier__scale">{scale}</span>
    </div>
  );
}

function BlockCard({ block }: { block: Block }) {
  return (
    <article className="block">
      <h4>{block.title}</h4>
      <p>{block.body}</p>
      {block.output && (
        <p className="block__output">
          <b>Output:</b> {block.output}
        </p>
      )}
    </article>
  );
}

/** A channel between two tiers, with water running down it. */
function Handoff({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`handoff ${className}`}>
      <svg viewBox="0 0 14 64" aria-hidden="true">
        <path className="channel-line" d="M7 4V54" />
        <path className="channel-flow" d="M7 4V52" />
        <path className="channel-head" d="M1.5 51h11L7 61z" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

/** What a tier sends across to the assistant. */
function Feed({ label }: { label: string }) {
  return (
    <span className="feed">
      {label}
      <svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
        <path className="channel-line" d="M2 6H90" vectorEffect="non-scaling-stroke" />
        <path className="channel-flow" d="M2 6H88" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

export function Framework() {
  const { assess, plan, act, advise, learn } = TIERS;
  return (
    <>
      <div className="framework">
        {/* Feedback loop: Learn back up to Assess */}
        <div className="loop" aria-hidden="true">
          <svg viewBox="0 0 46 100" preserveAspectRatio="none">
            <path d="M46 100H16V0H38" />
          </svg>
        </div>

        <section className="tier" aria-label="Step 1: Assess and anticipate">
          <TierHead step={assess.step} verb={assess.verb} scale={assess.scale} />
          <div className="tier__grid">
            {assess.blocks.map((b) => (
              <BlockCard key={b.title} block={b} />
            ))}
          </div>
        </section>
        <Handoff label={assess.handoff} />

        <section className="tier" aria-label="Step 2: Plan">
          <TierHead step={plan.step} verb={plan.verb} scale={plan.scale} />
          <div className="tier__grid">
            {plan.blocks.map((b) => (
              <BlockCard key={b.title} block={b} />
            ))}
          </div>
        </section>
        <Handoff label={plan.handoff} />

        <section className="tier" aria-label="Step 3: Act">
          <TierHead step={act.step} verb={act.verb} scale={act.scale} />
          <div className="horizons">
            {act.horizons.map((h) => (
              <article className="horizon" key={h.title}>
                <p className="horizon__when">{h.when}</p>
                <h4>{h.title}</h4>
                <ul className="ticks">
                  {h.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="funding">
            <p className="funding__label">How it is funded and sustained</p>
            {act.funding.map((f) => (
              <article className="fund" key={f.title}>
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="rail" aria-label="Step 4: Advise, SukhaRakshak AI">
          <div className="rail__slot rail__slot--1">
            <div>
              <TierHead step={advise.step} verb={advise.verb} scale={advise.scale} />
              <p className="rail__summary">{advise.summary}</p>
            </div>
            <article className="rail-card">
              <Feed label={advise.blocks[0].receives} />
              <h4>{advise.blocks[0].title}</h4>
              <p>{advise.blocks[0].body}</p>
            </article>
          </div>
          <div className="rail__slot rail__slot--2">
            <article className="rail-card">
              <Feed label={advise.blocks[1].receives} />
              <h4>{advise.blocks[1].title}</h4>
              <p>{advise.blocks[1].body}</p>
            </article>
          </div>
          <div className="rail__slot rail__slot--3">
            <AdvisorySample />
            <article className="rail-card">
              <Feed label={advise.blocks[2].receives} />
              <h4>{advise.blocks[2].title}</h4>
              <p>{advise.blocks[2].body}</p>
              <p>
                <b>Reaches:</b> {advise.reaches}
              </p>
              <p>
                <b>Returns:</b> {advise.returns}
              </p>
            </article>
          </div>
        </aside>

        <Handoff label={act.handoff} className="handoff--results" />
        <Handoff label={advise.handoff} className="handoff--rail" />

        <section className="learn" aria-label="Step 5: Learn">
          <TierHead step={learn.step} verb={learn.verb} scale={learn.scale} />
          <p className="learn__loop" style={{ marginTop: "-0.5rem", marginBottom: "1.1rem" }}>
            {learn.loop}
          </p>
          <div className="indicators">
            {learn.indicators.map((i) => (
              <article className="indicator" key={i.title}>
                <p className="indicator__level">{i.level}</p>
                <h4>{i.title}</h4>
                <p>{i.body}</p>
                <span className="pending">Target to be set</span>
              </article>
            ))}
          </div>
        </section>
      </div>
      <p className="note">{FRAMEWORK_NOTE}</p>
    </>
  );
}

import Link from "next/link";
import { Framework } from "@/components/Framework";
import { Landscape } from "@/components/Landscape";
import { StageCaption, StageDial } from "@/components/StageDial";
import { getSignal } from "@/lib/enso/client";
import { dateLabel, seasonAround, signed } from "@/lib/format";
import { countByStage } from "@/lib/triggers";

// Six hours. Next.js needs a literal here; keep it equal to REVALIDATE_SECONDS in lib/enso/client.ts.
export const revalidate = 21600;

export default async function HomePage() {
  const signal = await getSignal();
  const tn = signal.tamilNadu;
  const fourWeeks = tn.weeks.slice(0, 4);
  const meanAnomaly = fourWeeks.reduce((sum, w) => sum + w.anomalyMm, 0) / fourWeeks.length;
  const [normal, watch, alert] = countByStage(tn.districts);

  return (
    <>
      <section className="hero">
        <Landscape className="landscape--wide" />
        <div className="wrap">
          <div className="hero__copy">
            <h1 className="display">
              <span>Drought-proofing Tamil Nadu,</span> <span>village by village</span>
            </h1>
            <p className="lede">
              From vulnerability index to village action: prediction, block contingency plans, converged interventions,
              SukhaRakshak AI advisories and MELIA.
            </p>
          </div>
        </div>
        <Landscape className="landscape--narrow" viewBox="560 40 780 560" />
      </section>

      <section className="stage-bar" aria-label="Set the drought stage">
        <div className="wrap stage-bar__row">
          <p className="stage-bar__label">
            One trigger sets the stage. Pick a stage to see what it does to the tanks, and to every page of this site.
          </p>
          <StageDial />
          <StageCaption />
        </div>
      </section>

      <section className="signal-strip" aria-label="Climate signal today">
        <div className="wrap signal-strip__row">
          <div className="fact">
            <span className="fact__label">Pacific Ocean</span>
            <span className="fact__value">{signal.enso.label}</span>
            <span className="fact__note num">
              Relative Niño index {signed(signal.enso.roni)} °C, {seasonAround(signal.enso.month)}
            </span>
          </div>
          <div className="fact">
            <span className="fact__label">Tamil Nadu rainfall, next four weeks</span>
            <span className="fact__value num">{signed(meanAnomaly, 0)} mm a week against normal</span>
            <span className="fact__note">ECMWF sub-seasonal forecast issued {dateLabel(tn.s2sIssued)}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Forecast reading by district</span>
            <span className="fact__value num">
              {alert} Alert, {watch} Watch, {normal} Normal
            </span>
            <span className="fact__note">Illustrative rule, not a declaration</span>
          </div>
          <div className="signal-strip__more">
            <Link className="link" href="/signal">
              Open the climate signal
            </Link>
            <br />
            <span className="source-tag" data-source={signal.source}>
              {signal.source === "live" ? "Live from" : "Snapshot of"} IWMI ENSO Outlook, {dateLabel(signal.fetchedAt)}
            </span>
          </div>
        </div>
      </section>

      <section className="section" id="framework">
        <div className="wrap">
          <div className="section__head">
            <h2 className="display h2">Five steps, one loop</h2>
            <p className="lede">
              The state finds where drought will bite and when. Blocks and villages turn that into plans, plans into
              works, and an AI assistant carries each step to the farmer. What is learned each year goes back into the
              index and the plans.
            </p>
          </div>
          <Framework />
          <p style={{ marginTop: "2rem" }}>
            <Link className="link" href="/matrix">
              See what each stage sets in motion, from block to village
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

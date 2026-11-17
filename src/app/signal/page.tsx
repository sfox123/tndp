import type { Metadata } from "next";
import { DailyRain, IndexLine, ProbabilityBars, WeekBars } from "@/components/Charts";
import { DistrictExplorer } from "@/components/DistrictExplorer";
import { EnsoRibbon } from "@/components/EnsoRibbon";
import { getSignal } from "@/lib/enso/client";
import { tamilNaduOutline } from "@/lib/enso/snapshot";
import { dateLabel, dayLabel, monthLabel, percent, seasonAround, signed } from "@/lib/format";

export const metadata: Metadata = { title: "Climate signal" };
// Six hours. Next.js needs a literal here; keep it equal to REVALIDATE_SECONDS in lib/enso/client.ts.
export const revalidate = 21600;

export default async function SignalPage() {
  const signal = await getSignal();
  const { enso, events, probabilities, soi, iod, tamilNadu: tn, india } = signal;

  const earlier = events.filter((e) => e.peakMonth !== enso.month);
  const strongest = earlier.reduce((a, b) => (b.peak > a.peak ? b : a));
  const holds = [...probabilities].reverse().find((w) => w.elNino >= 0.9);
  const lastWindow = probabilities[probabilities.length - 1];
  const iodLatest = iod.weekly[iod.weekly.length - 1];
  const iodState =
    iodLatest.value >= iod.positiveAbove ? "positive" : iodLatest.value <= iod.negativeBelow ? "negative" : "neutral";

  return (
    <div className="wrap">
      <header className="page-head">
        <h1 className="display">The climate signal behind the trigger</h1>
        <p className="lede">
          TN-DEWS will turn forecasts into block-level triggers. Until it runs, this page reads the same kind of signal
          from the IWMI ENSO Outlook: the state of the Pacific, and what the forecasts say for each Tamil Nadu district
          over the next six weeks.
        </p>
        <span className="source-tag" data-source={signal.source}>
          {signal.source === "live" ? "Live from" : "Snapshot of"} the IWMI ENSO Outlook, read{" "}
          {dateLabel(signal.fetchedAt)}
        </span>
      </header>

      <section className="panel" aria-labelledby="pacific">
        <div className="phase-head" style={{ marginBottom: "1.75rem" }}>
          <div>
            <p className="muted small" id="pacific">
              The Pacific, {seasonAround(enso.month)}
            </p>
            <h2 className="display h2" style={{ margin: "0.3rem 0 0.8rem" }}>
              {enso.label}
            </h2>
            <p style={{ color: "var(--ink-2)", maxWidth: "52ch" }}>
              The index stands at <span className="num">{signed(enso.roni)} °C</span>. The highest peak on record since
              1950 is <span className="num">{signed(strongest.peak)} °C</span>, in {strongest.name}.
            </p>
          </div>
          <div className="phase-head__facts">
            <div className="stat">
              <span className="stat__value num">{signed(enso.roni)} °C</span>
              <span className="stat__label">Relative Oceanic Niño Index. El Niño at +0.5 or above.</span>
            </div>
            <div className="stat">
              <span className="stat__value num">{signed(soi.latest.value)}</span>
              <span className="stat__label">
                Southern Oscillation Index, 30 days to {dayLabel(soi.latest.date)}. El Niño signal below{" "}
                {signed(soi.elNinoBelow, 0)}.
              </span>
            </div>
            <div className="stat">
              <span className="stat__value num">{signed(iodLatest.value, 2)} °C</span>
              <span className="stat__label">
                Indian Ocean Dipole, week of {dayLabel(iodLatest.date)}: {iodState}. Positive above{" "}
                {signed(iod.positiveAbove)}.
              </span>
            </div>
          </div>
        </div>
        <EnsoRibbon tenths={signal.roniTenths} start={signal.roniStart} events={events} />
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="panel__head">
            <h2 className="h3">How long it is expected to last</h2>
            <p>
              {holds
                ? `El Niño is forecast to hold through ${holds.months} (${percent(holds.elNino)}). By ${lastWindow.months} the chance falls to ${percent(lastWindow.elNino)}.`
                : `By ${lastWindow.months} the chance of El Niño is ${percent(lastWindow.elNino)}.`}{" "}
              Source: {signal.probabilityRelease}.
            </p>
          </div>
          <ProbabilityBars windows={probabilities} />
        </section>
        <section className="panel">
          <div className="panel__head">
            <h2 className="h3">The atmosphere and the Indian Ocean</h2>
            <p>Two indices that shape how the Pacific signal reaches South India.</p>
          </div>
          <p className="small" style={{ fontWeight: 650, marginBottom: "0.25rem" }}>
            Southern Oscillation Index, monthly mean
          </p>
          <IndexLine
            points={soi.monthly}
            upper={soi.laNinaAbove}
            lower={soi.elNinoBelow}
            upperLabel="La Niña"
            lowerLabel="El Niño"
            monthly
            label="Southern Oscillation Index, monthly mean of the 30-day index"
          />
          <p className="small" style={{ fontWeight: 650, margin: "1rem 0 0.25rem" }}>
            Indian Ocean Dipole, weekly
          </p>
          <IndexLine
            points={iod.weekly}
            upper={iod.positiveAbove}
            lower={iod.negativeBelow}
            upperLabel="Positive"
            lowerLabel="Negative"
            unit=" °C"
            digits={2}
            label="Indian Ocean Dipole mode index, weekly"
          />
        </section>
      </div>

      <section className="section" id="tamil-nadu" style={{ paddingBottom: 0 }}>
        <div className="section__head">
          <h2 className="display h2">What the forecasts say for Tamil Nadu</h2>
          <p className="lede">
            Tamil Nadu gets about 48% of its annual rain from the northeast monsoon, October to December (
            <a
              className="link"
              href="https://mausam.imd.gov.in/Forecast/mcmarq/mcmarq_data/Outlook%20for%20the%20NE%20Monsoon%20over%20SPI_1Oct%2026_ENGLISH.pdf"
              target="_blank"
              rel="noreferrer"
            >
              IMD
            </a>
            ), so these are the weeks that fill the tanks.
          </p>
        </div>

        <div className="two-col" style={{ marginTop: 0 }}>
          <section className="panel">
            <div className="panel__head">
              <h3 className="h3">Weekly rainfall against normal, state average</h3>
              <p>ECMWF sub-seasonal forecast issued {dateLabel(tn.s2sIssued)}. Bars start on the date shown.</p>
            </div>
            <WeekBars
              anomalies={tn.weeks.map((w) => w.anomalyMm)}
              weeks={tn.weeks}
              drierPct={tn.weeks.map((w) => Math.round(w.shareDrier * 100))}
              label="Weekly rainfall anomaly forecast for Tamil Nadu, six weeks ahead, in millimetres against normal"
            />
          </section>
          <section className="panel">
            <div className="panel__head">
              <h3 className="h3">Daily rain, next 16 days</h3>
              <p>NOAA GEFS ensemble mean for Tamil Nadu, issued {dateLabel(tn.gefsIssued)}.</p>
            </div>
            <DailyRain
              days={tn.daily}
              label="Daily rainfall forecast for Tamil Nadu over the next sixteen days, in millimetres"
            />
          </section>
        </div>

        <section className="panel" style={{ marginTop: "1rem" }}>
          <div className="panel__head">
            <h3 className="h3">District by district</h3>
            <p>
              Each dot is a district, numbered and coloured by the stage an illustrative rule reads from its forecast.
              Move the thresholds to see how many districts a trigger would catch.
            </p>
          </div>
          <DistrictExplorer districts={tn.districts} weeks={tn.weeks} outline={tamilNaduOutline} />
        </section>

        <div className="two-col">
          <section className="panel">
            <div className="stat">
              <span className="stat__value num">{tn.waterStressScore.toFixed(1)}</span>
              <span className="stat__label">
                Baseline water stress score for Tamil Nadu, with {percent(tn.waterStressHighShare)} of the state&rsquo;s
                area rated high. Drought lands on a state already short of water.
              </span>
            </div>
          </section>
          <section className="panel">
            <div className="stat">
              <span className="stat__value num">
                {india.croplandBelowNormalMha.toFixed(1)} of {india.croplandTotalMha.toFixed(1)} Mha
              </span>
              <span className="stat__label">
                Indian cropland where the {india.period} seasonal forecast favours below-normal rain (issued{" "}
                {india.issued}); {india.croplandAboveNormalMha.toFixed(1)} Mha favours above-normal. The seasonal signal
                for India is weak, so the weekly forecasts above carry the detail.
              </span>
            </div>
          </section>
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="section__head">
          <h2 className="display h2">Where each figure comes from</h2>
        </div>
        <div className="panel table-scroll">
          <table className="sources">
            <thead>
              <tr>
                <th scope="col">Figure</th>
                <th scope="col">Source, through the ENSO Outlook</th>
                <th scope="col">Latest</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Niño index</td>
                <td>NOAA CPC Relative Oceanic Niño Index (RONI), monthly since 1950</td>
                <td className="num">{monthLabel(enso.month)}</td>
              </tr>
              <tr>
                <td>Season outlook</td>
                <td>IRI probabilistic ENSO forecast</td>
                <td>{signal.probabilityRelease}</td>
              </tr>
              <tr>
                <td>SOI</td>
                <td>Bureau of Meteorology Troup SOI, 30-day</td>
                <td className="num">{dateLabel(soi.latest.date)}</td>
              </tr>
              <tr>
                <td>IOD</td>
                <td>Bureau of Meteorology Dipole Mode Index, weekly</td>
                <td className="num">{dateLabel(iodLatest.date)}</td>
              </tr>
              <tr>
                <td>Weekly rainfall anomaly</td>
                <td>ECMWF sub-seasonal forecast, averaged over the state and each district</td>
                <td className="num">{dateLabel(tn.s2sIssued)}</td>
              </tr>
              <tr>
                <td>Daily rain</td>
                <td>NOAA GEFS ensemble mean</td>
                <td className="num">{dateLabel(tn.gefsIssued)}</td>
              </tr>
              <tr>
                <td>Weeks 2 to 4, 10-day outlook</td>
                <td>
                  IRI SubX and Open-Meteo (ECMWF IFS), from the ENSO Outlook&rsquo;s draft district advisory service
                </td>
                <td className="num">{dateLabel(signal.fetchedAt)}</td>
              </tr>
              <tr>
                <td>Districts</td>
                <td>
                  FAO GAUL boundaries, which list 30 districts for Tamil Nadu; newer districts fall inside their parent
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <p className="note">
          Figures refresh every six hours when the ENSO Outlook API can be reached, and fall back to a snapshot taken on
          17 November 2026 when it cannot. The district advisory service is marked as a draft by IWMI and is not yet
          validated with national partners.
        </p>
      </section>
    </div>
  );
}

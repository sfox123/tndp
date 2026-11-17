# Drought-proofing Tamil Nadu, village by village

A Next.js app that turns the two discussion mock-ups (the five-tier framework and the
block-to-village contingency matrix) into an interactive site, and reads them against
live climate figures from the [IWMI ENSO Outlook](https://enso.iwmi.org/).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build && npm start   # production build
npm test                     # checks the ENSO Outlook normalisers
npm run typecheck
```

Needs Node 20.9 or newer (Node 22.18+ for `npm test`).

## What is in it

| Page | What it shows |
|---|---|
| `/` Framework | An animated tank-cascade scene, the stage selector, today's signal, and the five steps (Assess, Plan, Act, Advise, Learn) with the SukhaRakshak AI rail and the feedback loop. |
| `/matrix` Contingency matrix | The stage-by-level matrix. Pick a stage and its column opens; below it, the districts an illustrative rule reads at that stage today. |
| `/signal` Climate signal | The Pacific since 1950, the season outlook, SOI and IOD, then Tamil Nadu: weekly rainfall anomaly, daily rain, and a district map with adjustable trigger thresholds. |
| `/api/signal` | The normalised figures as JSON. |

**One stage drives everything.** The selected drought stage is written to `<html data-stage>`.
The stylesheet reads that one attribute to change the landscape (sky, sun, rain, tank water
level, cracked beds, crop colour), the accents and the matrix. The scene itself is a static
SVG; no component re-renders when the stage changes.

## Where things live

```
src/lib/content.ts          Framework and matrix wording, transcribed from the mock-ups. Edit text here.
src/lib/triggers.ts         The illustrative trigger rule and its default thresholds.
src/lib/enso/client.ts      Server-side reader for the ENSO Outlook API (live, cached, with fallback).
src/lib/enso/normalise.ts   Pure functions: raw API response -> the app's Signal shape.
src/lib/enso/snapshot.json  Figures captured on 17 November 2026, served when the API is unreachable.
src/components/Landscape.tsx  The tank-cascade illustration.
src/app/globals.css         Design tokens and the per-stage variables (top of the file).
```

## The climate data

All requests run on the server (`src/lib/enso/client.ts`), are cached by Next.js and
revalidated every six hours. A quick probe decides live versus snapshot; each section also
falls back on its own, so one changed endpoint does not blank a page. Pages show which of
the two they are serving.

Endpoints used, under `https://enso.iwmi.org/ENSO_api/api/v1`:

| Endpoint | Used for |
|---|---|
| `/enso/current-phase`, `/enso/oni-historical`, `/enso/events` | ENSO phase, monthly RONI since 1950, past El Niño peaks |
| `/dashboard/outlook`, `/dashboard/outlook?iso3=IND` | Season probabilities (IRI), global and India exposure |
| `/enso/soi`, `/enso/iod` | Southern Oscillation Index, Indian Ocean Dipole |
| `/forecasts/s2s-anomaly/admin-series` | ECMWF weekly rainfall anomaly for Tamil Nadu and each district |
| `/forecasts/gefs/admin-series` | NOAA GEFS daily rain for Tamil Nadu |
| `/dashboard/agro-advisory` | Weeks 2 to 4 dry chance, 7-day rain, dry-spell days (IWMI marks this service as a draft) |
| `/dashboard/country-brief?iso3=IND` | Baseline water stress for Tamil Nadu |

These endpoints were read from the site's own network traffic; they are not a documented
public API, so confirm with the ENSO Outlook team before relying on them in production.

Environment variables (optional):

```
ENSO_API_BASE=https://enso.iwmi.org/ENSO_api/api/v1
ENSO_LIVE=0        # always serve the snapshot
```

To refresh the snapshot, run the app where it can reach the API, then `npm run snapshot`.

## The illustrative trigger rule

TN-DEWS does not exist yet and its thresholds are still to be set, so `src/lib/triggers.ts`
reads a stage from the forecasts the ENSO Outlook already publishes for each district:

- **Watch** when the mean weekly rainfall anomaly over the next four weeks is at or below −10 mm.
- **Alert** when a district on Watch also has a dry run of 5 days or more in the next 10.
- **Severe** is never read from a forecast; it needs an observed, sustained deficit.

Both thresholds can be moved on the Climate signal page. They are placeholders for
discussion, not proposals.

## To confirm before this is shown widely

- Stage names, thresholds, actions, funding windows and MELIA targets (as the mock-ups say).
- The Tamil sample advisories in `src/lib/content.ts`, with TNAU extension.
- Districts follow FAO GAUL, which lists 30 for Tamil Nadu; newer districts sit inside their parents.
- The live API path has unit tests on recorded responses, but the build machine could not
  reach enso.iwmi.org, so run the app once on your network and check the "Live from" tag appears.

/**
 * Refresh the bundled snapshot from a running copy of the app.
 *
 *   npm run dev            (in one terminal)
 *   npm run snapshot       (in another)
 *
 * It reads the app's own /api/signal route, so the snapshot always has the
 * exact shape the pages expect. Nothing is written unless the route reports
 * live data.
 */
import { writeFile } from "node:fs/promises";

const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
const target = new URL("../src/lib/enso/snapshot.json", import.meta.url);

const res = await fetch(`${origin}/api/signal`);
if (!res.ok) {
  console.error(`Could not read ${origin}/api/signal (${res.status}). Is the app running?`);
  process.exit(1);
}
const signal = await res.json();
if (signal.source !== "live") {
  console.error("The app is serving its snapshot, so the ENSO Outlook API was not reachable. Nothing written.");
  process.exit(1);
}

signal.source = "snapshot";
const compact = JSON.stringify(signal, null, 2).replace(/\[\s+(-?[\d.]+(?:,\s+-?[\d.]+)*)\s+\]/g, (_, list) => `[${list.replace(/\s+/g, " ")}]`);
await writeFile(target, `${compact}\n`);
console.log(`Snapshot refreshed from ${origin}, figures read ${signal.fetchedAt}.`);

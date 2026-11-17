/**
 * Figures read from the IWMI ENSO Outlook API (https://enso.iwmi.org/ENSO_api/api/v1)
 * on 17 November 2026. The app serves these whenever the live API cannot be reached,
 * so every page still renders offline. Refresh with: npm run snapshot
 */
import type { Signal } from "./types";
import data from "./snapshot.json";
import outline from "./tamil-nadu-outline.json";

export const snapshot = data as Signal;

/**
 * Tamil Nadu boundary, simplified from the admin-1 layer the ENSO Outlook serves
 * (largest ring only, about 2 km tolerance). [longitude, latitude] pairs.
 */
export const tamilNaduOutline = outline as [number, number][];

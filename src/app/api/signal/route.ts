import { NextResponse } from "next/server";
import { getSignal } from "@/lib/enso/client";

// Six hours. Next.js needs a literal here; keep it equal to REVALIDATE_SECONDS in lib/enso/client.ts.
export const revalidate = 21600;

/** The normalised signal as JSON, for other tools and for `npm run snapshot`. */
export async function GET() {
  return NextResponse.json(await getSignal());
}

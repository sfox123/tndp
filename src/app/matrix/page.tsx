import type { Metadata } from "next";
import { Landscape } from "@/components/Landscape";
import { Matrix, StageReading } from "@/components/Matrix";
import { StageDial } from "@/components/StageDial";
import { getSignal } from "@/lib/enso/client";

export const metadata: Metadata = { title: "Contingency matrix" };
// Six hours. Next.js needs a literal here; keep it equal to REVALIDATE_SECONDS in lib/enso/client.ts.
export const revalidate = 21600;

export default async function MatrixPage() {
  const signal = await getSignal();
  return (
    <div className="wrap">
      <header className="page-head">
        <h1 className="display">Block-to-village drought contingency matrix</h1>
        <p className="lede">
          One trigger from TN-DEWS sets the stage. The stage selects what the block does, what the village does, what
          SukhaRakshak AI sends and which funds open.
        </p>
      </header>

      <div className="scene-strip">
        <Landscape viewBox="0 190 1440 410" />
      </div>
      <div className="matrix-controls">
        <StageDial />
      </div>

      <Matrix />
      <StageReading districts={signal.tamilNadu.districts} />
    </div>
  );
}

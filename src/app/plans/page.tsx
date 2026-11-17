import type { Metadata } from "next";
import Link from "next/link";
import { PlansSource } from "@/components/plans/PlansSource";
import { getDistricts, PlansUnavailable, STATE, type DistrictSummary } from "@/lib/plans/data";
import { districtHref, districtName, fmtDate } from "@/lib/plans/format";

export const metadata: Metadata = { title: "District contingency plans" };
// One hour. Keep equal to REVALIDATE_SECONDS in lib/plans/data.ts.
export const revalidate = 3600;

export default async function PlansPage() {
  let districts: DistrictSummary[] = [];
  let problem: string | null = null;
  try {
    districts = await getDistricts();
  } catch (error) {
    if (!(error instanceof PlansUnavailable)) throw error;
    problem = error.message;
  }
  const sections = districts.reduce((n, d) => n + d.sections, 0);

  return (
    <div className="wrap plans">
      <header className="page-head">
        <p className="plans-eyebrow small">
          {STATE}
          {districts.length > 0 && (
            <>
              {" "}
              · <span className="num">{districts.length}</span> districts ·{" "}
              <span className="num">{sections.toLocaleString("en-IN")}</span> sections
            </>
          )}
        </p>
        <h1 className="display">District agriculture contingency plans</h1>
        <p className="lede">
          What each district does when the monsoon is delayed, a dry spell sets in, rain fails late in the season or
          floods arrive, crop by crop and for livestock, poultry and fisheries. These are the plans the matrix&rsquo;s
          block and village actions draw on.
        </p>
        <PlansSource />
      </header>

      {problem ? (
        <p className="plans-notice">
          <strong>The plans could not be loaded.</strong> {problem}
        </p>
      ) : (
        <div className="plans-ledger-wrap">
          <table className="plans-ledger">
            <thead>
              <tr>
                <th scope="col">District</th>
                <th scope="col" className="plans-ledger__n">
                  Sections
                </th>
                <th scope="col">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {districts.map((d) => (
                <tr key={d.district}>
                  <td>
                    <Link href={districtHref(d.district)} className="link">
                      {districtName(d.district)}
                    </Link>
                  </td>
                  <td className="plans-ledger__n num">{d.sections}</td>
                  <td className="num muted">{fmtDate(d.lastUpdated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


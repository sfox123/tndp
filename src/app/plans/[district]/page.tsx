import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlansSource } from "@/components/plans/PlansSource";
import { CategoryIcon } from "@/components/plans/CategoryIcon";
import { SectionBody } from "@/components/plans/SectionBody";
import { SectionSearch } from "@/components/plans/SectionSearch";
import { bodyText } from "@/lib/plans/body";
import { CATEGORIES, CATEGORY_BY_ID, GROUP_LABEL, type CategoryGroup } from "@/lib/plans/categories";
import { getDistrictPlan, PlansUnavailable, STATE, type PlanSection } from "@/lib/plans/data";
import { displayHeader, districtHref, districtName, fmtDate, headerParts } from "@/lib/plans/format";
import { titlesInOrder } from "@/lib/plans/section-title";

const GROUPS: CategoryGroup[] = ["profile", "strategy", "other"];

type Params = Promise<{ district: string }>;

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const district = decode((await params).district);
  return { title: `${districtName(district)} contingency plan` };
}

export default async function DistrictPlanPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ topic?: string; q?: string }>;
}) {
  const district = decode((await params).district);
  const sp = await searchParams;
  const name = districtName(district);

  let all: PlanSection[];
  try {
    all = await getDistrictPlan(district);
  } catch (error) {
    if (!(error instanceof PlansUnavailable)) throw error;
    return (
      <div className="wrap plans">
        <DistrictHead name={name} />
        <p className="plans-notice">
          <strong>This plan could not be loaded.</strong> {error.message}
        </p>
      </div>
    );
  }
  if (!all.length) notFound();

  const counts: Record<string, number> = {};
  for (const s of all) counts[s.topic] = (counts[s.topic] ?? 0) + 1;

  const q = (sp.q ?? "").trim();
  const topic = sp.topic && counts[sp.topic] ? sp.topic : CATEGORIES.find((c) => counts[c.id])!.id;
  const category = CATEGORY_BY_ID[topic];

  const needle = q.toLowerCase();
  const shown = q
    ? all.filter((s) => `${displayHeader(s.header)}\n${bodyText(s.body)}`.toLowerCase().includes(needle))
    : all.filter((s) => s.topic === topic);
  const titles = titlesInOrder(shown.map((s) => ({ id: s.id, title: headerParts(s.header).title, body: s.body })));
  const base = districtHref(district);

  return (
    <div className="wrap plans">
      <DistrictHead name={name} />

      <div className="plans-searchbar">
        <SectionSearch total={all.length} initial={q} />
      </div>

      <div className="plans-layout">
        {/* ---------------------------------------------- topics */}
        <nav aria-label="Topics" className="plans-topics">
          <div className="plans-topics__inner">
            {GROUPS.map((group) => {
              const list = CATEGORIES.filter((c) => c.group === group && counts[c.id]);
              if (!list.length) return null;
              return (
                <div key={group} className="plans-topics__group">
                  <p className="plans-topics__label small">{GROUP_LABEL[group]}</p>
                  <ul>
                    {list.map((c) => {
                      const on = !q && c.id === topic;
                      return (
                        <li key={c.id}>
                          <Link
                            href={`${base}?topic=${c.id}`}
                            aria-current={on ? "page" : undefined}
                            className="plans-topic"
                            scroll={false}
                          >
                            <CategoryIcon id={c.id} />
                            <span className="plans-topic__label">{c.label}</span>
                            <span className="plans-topic__n num">{counts[c.id]}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </nav>

        {/* ---------------------------------------------- sections of the chosen topic */}
        <div className="plans-main">
          {q ? (
            <div className="plans-main__head plans-main__head--search">
              <h2 className="h3">
                <span className="num">{shown.length}</span> result{shown.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
              </h2>
              <Link href={`${base}?topic=${topic}`} className="link small">
                Clear search
              </Link>
            </div>
          ) : (
            <div className="plans-main__head">
              <CategoryIcon id={topic} size="lg" />
              <div>
                <p className="small muted">
                  {GROUP_LABEL[category.group]} · <span className="num">{shown.length}</span> section
                  {shown.length === 1 ? "" : "s"}
                </p>
                <h2 className="h3">{category.label}</h2>
                <p className="small muted">{category.hint}</p>
              </div>
            </div>
          )}

          {!q && shown.length > 5 && (
            <ul className="plans-jump">
              {shown.map((s) => {
                const h = headerParts(s.header);
                return (
                  <li key={s.id}>
                    <a href={`#s-${s.id}`}>
                      {h.number && <span className="num">{h.number}</span>}
                      <span className="plans-jump__t">{titles.get(s.id)}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="plans-list">
            {shown.map((s) => {
              const h = { ...headerParts(s.header), title: titles.get(s.id)! };
              const cat = CATEGORY_BY_ID[s.topic] ?? CATEGORY_BY_ID.other;
              return (
                <article key={s.id} id={`s-${s.id}`} className="plan-card">
                  <header className="plan-card__head">
                    {q && (
                      <Link href={`${base}?topic=${cat.id}`} className="plan-card__topic small">
                        <CategoryIcon id={cat.id} size="sm" /> {cat.label}
                      </Link>
                    )}
                    <div className="plan-card__title">
                      {h.number && <span className="num plan-card__num">{h.number}</span>}
                      <h3>{h.title}</h3>
                    </div>
                  </header>
                  <div className="plan-card__body">
                    <SectionBody body={s.body} />
                  </div>
                  <footer className="plan-card__foot small muted">
                    <span>Version {s.version}</span>
                    <span>
                      Updated {fmtDate(s.updated_at)}
                      {s.version === 1 ? " · original plan" : ""}
                    </span>
                  </footer>
                </article>
              );
            })}
            {!shown.length && (
              <p className="plans-notice">
                <strong>No section matches your search.</strong> Try a shorter word, or pick a topic.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DistrictHead({ name }: { name: string }) {
  return (
    <header className="page-head page-head--tight">
      <p className="plans-eyebrow small">
        <Link href="/plans" className="link">
          District plans
        </Link>{" "}
        / {STATE}
      </p>
      <h1 className="display">{name}</h1>
      <p className="lede">District agriculture contingency plan</p>
      <PlansSource />
    </header>
  );
}

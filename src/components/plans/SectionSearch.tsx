"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

// Search box on a district plan. It looks through every topic of the district at once;
// the page re-renders with the matches (the query lives in the address as ?q=).
export function SectionSearch({ total, initial }: { total: number; initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initial);
  const [pending, start] = useTransition();
  const last = useRef(initial);

  // Picking a topic clears the search in the address; follow it here.
  useEffect(() => {
    if (initial !== last.current) {
      last.current = initial;
      setQ(initial);
    }
  }, [initial]);

  useEffect(() => {
    const value = q.trim();
    if (value === last.current) return;
    const t = setTimeout(() => {
      last.current = value;
      start(() => router.replace(value ? `${pathname}?q=${encodeURIComponent(value)}` : pathname, { scroll: false }));
    }, 350);
    return () => clearTimeout(t);
  }, [q, pathname, router]);

  return (
    <div className="plan-search">
      <div className="plan-search__box">
        <Search size={17} className="plan-search__icon" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search this district: crop, hazard, a number…"
          aria-label="Search this district's plan"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="plan-search__clear" aria-label="Clear search">
            <X size={15} />
          </button>
        )}
      </div>
      <span className="plan-search__count small muted num" aria-live="polite">
        {pending && <span className="plan-spinner" aria-hidden="true" />}
        {total} sections
      </span>
    </div>
  );
}

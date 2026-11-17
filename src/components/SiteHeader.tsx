"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StageDial } from "./StageDial";

const LINKS = [
  { href: "/", label: "Framework" },
  { href: "/matrix", label: "Contingency matrix" },
  { href: "/signal", label: "Climate signal" },
  { href: "/plans", label: "District plans" },
];

// "/plans" stays highlighted on a district page ("/plans/ARIYALUR").
const isCurrent = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="wrap site-header__row">
        <Link href="/" className="brand" aria-label="Drought-proofing Tamil Nadu, home">
          {/* Three tanks stepping down a slope */}
          <svg viewBox="0 0 30 30" aria-hidden="true">
            <rect width="30" height="30" rx="8" fill="#0c2a35" />
            <ellipse className="brand__water" cx="9" cy="9.5" rx="4.5" ry="2.2" />
            <ellipse className="brand__water" cx="15.5" cy="15" rx="6" ry="2.8" />
            <ellipse className="brand__water" cx="19" cy="21.5" rx="7.5" ry="3.3" />
          </svg>
          Drought-proofing Tamil Nadu
        </Link>
        <nav className="nav" aria-label="Sections">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={isCurrent(pathname, link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-stage">
          <span>Stage</span>
          <StageDial size="compact" label="Drought stage, applies to every page" />
        </div>
      </div>
    </header>
  );
}

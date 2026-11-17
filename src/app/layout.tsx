import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource/noto-sans-tamil/tamil-400.css";
import "@fontsource/noto-sans-tamil/tamil-600.css";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { StageProvider } from "@/components/StageProvider";

export const metadata: Metadata = {
  title: {
    default: "Drought-proofing Tamil Nadu, village by village",
    template: "%s | Drought-proofing Tamil Nadu",
  },
  description:
    "From vulnerability index to village action: drought prediction, block contingency plans, converged interventions, SukhaRakshak AI advisories and MELIA, read against the live ENSO signal.",
};

export const viewport: Viewport = { themeColor: "#0c2a35" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-stage="0">
      <body>
        <StageProvider>
          <a className="visually-hidden" href="#main">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <footer className="site-footer">
            <div className="wrap site-footer__row">
              <p>
                <strong>A working mock-up for discussion with TNSDMA and IWMI.</strong> Stage names, thresholds,
                actions, funding windows and MELIA targets are illustrative and are to be set with TNSDMA, TNDRRA, TNAU
                and ICAR-CRIDA.
              </p>
              <p>
                Climate figures come from the{" "}
                <a href="https://enso.iwmi.org/" target="_blank" rel="noreferrer">
                  IWMI ENSO Outlook
                </a>
                , which draws on NOAA CPC, IRI, ECMWF, NOAA GEFS and the Bureau of Meteorology. Check critical figures
                against the source before formal decisions.
              </p>
            </div>
          </footer>
        </StageProvider>
      </body>
    </html>
  );
}

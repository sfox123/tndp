"use client";

import { useState } from "react";
import { ADVISORIES, STAGES } from "@/lib/content";
import { useStage } from "./StageProvider";

/** One sample message per drought stage, in English or Tamil. */
export function AdvisorySample() {
  const { stage } = useStage();
  const [lang, setLang] = useState<"en" | "ta">("en");
  const message = ADVISORIES[stage];

  return (
    <div>
      <div className="sms">
        <div className="sms__meta">
          <span>
            <span className="pip" data-s={stage}>
              {stage}
            </span>
            Stage {stage}, {STAGES[stage].name}
          </span>
          <span className="lang" role="group" aria-label="Message language">
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              English
            </button>
            <button type="button" aria-pressed={lang === "ta"} onClick={() => setLang("ta")} lang="ta">
              தமிழ்
            </button>
          </span>
        </div>
        <p className="sms__text" lang={lang} aria-live="polite">
          {message[lang]}
        </p>
      </div>
      <p className="sms__note" style={{ marginTop: "0.5rem" }}>
        Sample wording for review by TNAU extension. Changes with the stage you set.
      </p>
    </div>
  );
}

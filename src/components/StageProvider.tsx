"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Stage } from "@/lib/triggers";

type StageContext = { stage: Stage; setStage: (stage: Stage) => void };

const Context = createContext<StageContext>({ stage: 0, setStage: () => {} });

const KEY = "drought-stage";

/**
 * One drought stage for the whole app. It is written to <html data-stage>,
 * and the stylesheet does the rest: the landscape, the accents and the
 * matrix all follow that single attribute.
 */
export function StageProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStageState] = useState<Stage>(0);

  useEffect(() => {
    try {
      const saved = Number(window.sessionStorage.getItem(KEY));
      if (saved >= 1 && saved <= 3) setStageState(saved as Stage);
    } catch {
      /* storage unavailable: keep the default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.stage = String(stage);
  }, [stage]);

  const setStage = useCallback((next: Stage) => {
    setStageState(next);
    try {
      window.sessionStorage.setItem(KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ stage, setStage }), [stage, setStage]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useStage() {
  return useContext(Context);
}

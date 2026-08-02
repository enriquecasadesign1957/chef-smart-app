"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "chef-smart-session-v1";

export type ChefSession = {
  ingredientsText: string;
  budgetClp: number;
  weekBudgetClp: number;
};

type ChefContextValue = ChefSession & {
  setIngredientsText: (v: string) => void;
  setBudgetClp: (v: number) => void;
  setWeekBudgetClp: (v: number) => void;
  pantryTokens: string[];
  hydrated: boolean;
};

const defaults: ChefSession = {
  ingredientsText: "pollo, arroz, huevos, cebolla",
  budgetClp: 15000,
  weekBudgetClp: 105000,
};

const ChefContext = createContext<ChefContextValue | null>(null);

export function ChefProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ChefSession>(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ChefSession>;
        setSession({
          ingredientsText: parsed.ingredientsText ?? defaults.ingredientsText,
          budgetClp: parsed.budgetClp ?? defaults.budgetClp,
          weekBudgetClp: parsed.weekBudgetClp ?? defaults.weekBudgetClp,
        });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }, [session, hydrated]);

  const setIngredientsText = useCallback((ingredientsText: string) => {
    setSession((s) => ({ ...s, ingredientsText }));
  }, []);

  const setBudgetClp = useCallback((budgetClp: number) => {
    setSession((s) => ({ ...s, budgetClp }));
  }, []);

  const setWeekBudgetClp = useCallback((weekBudgetClp: number) => {
    setSession((s) => ({ ...s, weekBudgetClp }));
  }, []);

  const pantryTokens = useMemo(
    () =>
      session.ingredientsText
        .toLowerCase()
        .split(/[\s,;]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [session.ingredientsText],
  );

  const value = useMemo(
    () => ({
      ...session,
      setIngredientsText,
      setBudgetClp,
      setWeekBudgetClp,
      pantryTokens,
      hydrated,
    }),
    [session, setIngredientsText, setBudgetClp, setWeekBudgetClp, pantryTokens, hydrated],
  );

  return <ChefContext.Provider value={value}>{children}</ChefContext.Provider>;
}

export function useChefSession() {
  const ctx = useContext(ChefContext);
  if (!ctx) throw new Error("useChefSession debe usarse dentro de ChefProvider");
  return ctx;
}

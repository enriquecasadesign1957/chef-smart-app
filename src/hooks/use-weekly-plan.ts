"use client";

import { useCallback, useState } from "react";
import {
  fetchMyWeeklyPlan,
  generateWeeklyPlan,
  type GenerateWeeklyPlanInput,
  type WeeklyPlanSlot,
} from "@/lib/api/weekly-plan";

export function useWeeklyPlan() {
  const [plan, setPlan] = useState<WeeklyPlanSlot[]>([]);
  const [source, setSource] = useState<"worker" | "supabase" | "demo" | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (input: GenerateWeeklyPlanInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateWeeklyPlan(input);
      setPlan(res.plan);
      setSource(res.source);
      setSaved(res.saved);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo generar el plan";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchMyWeeklyPlan();
      if (rows) {
        setPlan(rows);
        setSource("supabase");
        setSaved(true);
      }
      return rows;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar el plan";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { plan, source, saved, loading, error, generate, loadSaved };
}

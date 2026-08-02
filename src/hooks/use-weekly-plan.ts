"use client";

import { useCallback, useState } from "react";
import {
  fetchMyWeeklyPlan,
  generateWeeklyPlan,
  saveWeeklyPlanToSupabase,
  type GenerateWeeklyPlanInput,
  type WeeklyPlanSlot,
} from "@/lib/api/weekly-plan";

export function useWeeklyPlan() {
  const [plan, setPlan] = useState<WeeklyPlanSlot[]>([]);
  const [source, setSource] = useState<"worker" | "supabase" | "demo" | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekTotal, setWeekTotal] = useState(0);
  const [weekBudget, setWeekBudget] = useState(0);
  const [withinBudget, setWithinBudget] = useState(true);

  const generate = useCallback(async (input: GenerateWeeklyPlanInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateWeeklyPlan(input);
      setPlan(res.plan);
      setSource(res.source);
      setSaved(res.saved);
      setWeekTotal(res.weekTotal);
      setWeekBudget(res.weekBudget);
      setWithinBudget(res.withinBudget);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo generar el plan";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (userId?: string) => {
    setSaving(true);
    setError(null);
    try {
      const ok = await saveWeeklyPlanToSupabase(plan, userId);
      setSaved(ok);
      if (!ok) {
        setError("Inicia sesión en Supabase para guardar el plan en weekly_plans.");
      }
      return ok;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo guardar el plan";
      setError(msg);
      throw e;
    } finally {
      setSaving(false);
    }
  }, [plan]);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchMyWeeklyPlan();
      if (rows) {
        setPlan(rows);
        setSource("supabase");
        setSaved(true);
        const total = rows.reduce((sum, s) => sum + s.recipe.cost, 0);
        setWeekTotal(total);
        const daily = rows[0]?.budget ?? 0;
        setWeekBudget(daily * 7);
        setWithinBudget(total <= daily * 7);
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

  return {
    plan,
    source,
    saved,
    loading,
    saving,
    error,
    weekTotal,
    weekBudget,
    withinBudget,
    generate,
    save,
    loadSaved,
  };
}

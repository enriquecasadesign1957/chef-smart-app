"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import { useChefSession } from "@/lib/chef-session";
import { formatClp } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function PlanPage() {
  const { weekBudgetClp, setWeekBudgetClp, pantryTokens } = useChefSession();
  const { plan, source, saved, loading, error, generate } = useWeeklyPlan();

  useEffect(() => {
    void generate({
      budget: weekBudgetClp,
      ingredients: pantryTokens,
      persist: true,
    });
  }, [weekBudgetClp, pantryTokens, generate]);

  const total = useMemo(
    () => plan.reduce((sum, slot) => sum + slot.recipe.cost, 0),
    [plan],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, typeof plan>();
    for (const slot of plan) {
      const list = map.get(slot.day) ?? [];
      list.push(slot);
      map.set(slot.day, list);
    }
    return [...map.entries()];
  }, [plan]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--cs-brand)]">
          Plan semanal
        </h1>
        <p className="mt-2 text-sm text-[var(--cs-muted)]">
          Menú ajustado a tu presupuesto
          {source ? ` · ${source === "supabase" ? "Supabase" : "Demo"}` : ""}
          {saved ? " · guardado" : ""}
        </p>
        {!isSupabaseConfigured() && (
          <p className="mt-2 text-xs text-amber-800">
            Sin Supabase Auth no se guarda el plan (solo se genera en el dispositivo).
          </p>
        )}
      </div>

      <label className="block space-y-2 rounded-2xl border border-[var(--cs-line)] bg-white/70 p-4">
        <span className="text-sm font-semibold text-[var(--cs-brand)]">
          Presupuesto semanal: {formatClp(weekBudgetClp)}
        </span>
        <input
          type="range"
          min={20000}
          max={120000}
          step={2500}
          value={weekBudgetClp}
          onChange={(e) => setWeekBudgetClp(Number(e.target.value))}
          className="w-full accent-[var(--cs-brand)]"
        />
        <p className="text-xs text-[var(--cs-muted)]">
          Estimado del menú: <strong className="text-[var(--cs-brand)]">{formatClp(total)}</strong>
          {total > weekBudgetClp ? " · sobre el tope" : " · dentro del tope"}
        </p>
      </label>

      {loading && <p className="text-sm text-[var(--cs-muted)]">Generando plan…</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="space-y-4">
        {byDay.map(([day, slots]) => (
          <section key={day} className="rounded-2xl border border-[var(--cs-line)] bg-[var(--cs-card)] p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--cs-accent)]">{day}</h2>
            <ul className="mt-2 space-y-2">
              {slots.map((slot) => (
                <li key={`${slot.day}-${slot.meal_type}`} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold capitalize text-[var(--cs-muted)]">
                      {slot.meal_type}
                    </p>
                    <p className="truncate font-semibold text-[var(--cs-brand)]">{slot.recipe.name}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-[var(--cs-accent)]">
                    {formatClp(slot.recipe.cost)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Link
        href="/compras/"
        className="flex w-full items-center justify-center rounded-2xl bg-[var(--cs-brand)] px-5 py-4 text-base font-bold text-white"
      >
        Ver lista de compras
      </Link>
    </div>
  );
}

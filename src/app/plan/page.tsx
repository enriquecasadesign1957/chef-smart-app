"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import { PLAN_DAYS } from "@/lib/api/weekly-plan";
import { useChefSession } from "@/lib/chef-session";
import { formatClp } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const DAILY_MIN = 5000;
const DAILY_MAX = 50000;
const DAILY_STEP = 500;
const DAILY_DEFAULT = 15000;

export default function PlanPage() {
  const { pantryTokens, setBudgetClp, setWeekBudgetClp, budgetClp, hydrated } =
    useChefSession();
  const {
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
  } = useWeeklyPlan();

  const [dailyBudget, setDailyBudget] = useState(DAILY_DEFAULT);

  useEffect(() => {
    if (!hydrated) return;
    const fromSession =
      budgetClp >= DAILY_MIN && budgetClp <= DAILY_MAX ? budgetClp : DAILY_DEFAULT;
    setDailyBudget(fromSession);
  }, [hydrated, budgetClp]);

  const byDay = useMemo(() => {
    return PLAN_DAYS.map((day) => {
      const slots = plan.filter((s) => s.day === day);
      const almuerzo = slots.find((s) => s.meal_type === "almuerzo");
      const cena = slots.find((s) => s.meal_type === "cena");
      const dayTotal = (almuerzo?.recipe.cost ?? 0) + (cena?.recipe.cost ?? 0);
      return {
        day,
        almuerzo,
        cena,
        dayTotal,
        overDaily: dayTotal > dailyBudget,
      };
    });
  }, [plan, dailyBudget]);

  function onDailyChange(value: number) {
    setDailyBudget(value);
    setBudgetClp(value);
    setWeekBudgetClp(value * 7);
  }

  async function onGenerate() {
    setBudgetClp(dailyBudget);
    setWeekBudgetClp(dailyBudget * 7);
    await generate({
      dailyBudget,
      ingredients: pantryTokens,
      persist: true,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--cs-brand)]">
          Plan semanal
        </h1>
        <p className="mt-2 text-sm text-[var(--cs-muted)]">
          Vinculado a tu presupuesto diario · almuerzo y cena
          {source ? ` · ${source === "worker" ? "API" : source === "supabase" ? "Supabase" : "Demo"}` : ""}
          {saved ? " · guardado en weekly_plans" : ""}
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700/80">
              Presupuesto diario
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-blue-950">
              {formatClp(dailyBudget)}
            </p>
          </div>
          <p className="text-right text-xs text-blue-800/80">
            Semanal estimado
            <br />
            <span className="font-bold tabular-nums">{formatClp(dailyBudget * 7)}</span>
          </p>
        </div>

        <label className="block space-y-2">
          <span className="sr-only">Ajustar presupuesto diario</span>
          <input
            type="range"
            min={DAILY_MIN}
            max={DAILY_MAX}
            step={DAILY_STEP}
            value={dailyBudget}
            onChange={(e) => onDailyChange(Number(e.target.value))}
            className="w-full accent-blue-700"
          />
          <div className="flex justify-between text-[11px] font-medium text-blue-800/70">
            <span>{formatClp(DAILY_MIN)}</span>
            <span>{formatClp(DAILY_MAX)}</span>
          </div>
        </label>

        <button
          type="button"
          disabled={loading || !hydrated}
          onClick={() => void onGenerate()}
          className="flex w-full items-center justify-center rounded-2xl bg-blue-700 px-5 py-4 text-base font-bold text-white transition enabled:hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? "Generando plan…" : "🗓️ Generar Plan Semanal Variado"}
        </button>
      </section>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {plan.length > 0 && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            withinBudget && !byDay.some((d) => d.overDaily)
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <p>
            Total semana: <strong>{formatClp(weekTotal)}</strong>
            {" · "}
            Tope: <strong>{formatClp(weekBudget || dailyBudget * 7)}</strong>
          </p>
          <p className="mt-1 text-xs opacity-90">
            {withinBudget && !byDay.some((d) => d.overDaily)
              ? "Cada día (almuerzo + cena) cabe en tu presupuesto diario."
              : "Hay días o el total semanal fuera de presupuesto; ajusta el slider y regenera."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {plan.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-[var(--cs-line)] bg-white/60 p-6 text-center text-sm text-[var(--cs-muted)]">
            Fija tu presupuesto diario y genera un plan variado de Lunes a Domingo.
          </div>
        ) : (
          byDay.map(({ day, almuerzo, cena, dayTotal, overDaily }) => (
            <section
              key={day}
              className={`rounded-2xl border p-4 ${
                overDaily
                  ? "border-amber-200 bg-amber-50/70"
                  : "border-[var(--cs-line)] bg-[var(--cs-card)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--cs-accent)]">
                  {day}
                </h2>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    overDaily ? "text-amber-800" : "text-[var(--cs-brand)]"
                  }`}
                >
                  {formatClp(dayTotal)}
                  <span className="ml-1 text-xs font-medium text-[var(--cs-muted)]">
                    / {formatClp(dailyBudget)}
                  </span>
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {(
                  [
                    ["Almuerzo", almuerzo],
                    ["Cena", cena],
                  ] as const
                ).map(([label, slot]) => (
                  <li
                    key={`${day}-${label}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-muted)]">
                        {label}
                      </p>
                      <p className="truncate font-semibold text-[var(--cs-brand)]">
                        {slot?.recipe.name ?? "—"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[var(--cs-accent)]">
                      {slot ? formatClp(slot.recipe.cost) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {plan.length > 0 && (
        <button
          type="button"
          disabled={saving || saved}
          onClick={() => void save()}
          className="flex w-full items-center justify-center rounded-2xl border-2 border-[var(--cs-brand)] px-5 py-3.5 text-base font-bold text-[var(--cs-brand)] disabled:opacity-60"
        >
          {saved
            ? "Plan guardado en Supabase"
            : saving
              ? "Guardando…"
              : "Guardar plan en weekly_plans"}
        </button>
      )}

      {!isSupabaseConfigured() && (
        <p className="text-xs text-amber-800">
          Sin keys de Supabase el plan se genera igual, pero no se persiste en{" "}
          <code>weekly_plans</code>.
        </p>
      )}

      <Link
        href="/compras/"
        className="flex w-full items-center justify-center rounded-2xl bg-[var(--cs-brand)] px-5 py-4 text-base font-bold text-white"
      >
        Ver lista de compras
      </Link>
    </div>
  );
}

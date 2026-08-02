"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MealThumb } from "@/components/meal-thumb";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import { PLAN_DAYS, type WeeklyPlanSlot } from "@/lib/api/weekly-plan";
import { useChefSession } from "@/lib/chef-session";
import { formatClp } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const DAILY_MIN = 5000;
const DAILY_MAX = 50000;
const DAILY_STEP = 500;
const DAILY_DEFAULT = 15000;

function MealRow({
  label,
  slot,
}: {
  label: string;
  slot?: WeeklyPlanSlot;
}) {
  const name = slot?.recipe.name ?? "Sin plato";
  const cost = slot?.recipe.cost;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-2.5 ring-1 ring-black/[0.04]">
      <MealThumb title={slot?.recipe.name ?? `${label} saludable`} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
        <p className="mt-0.5 text-md font-semibold text-emerald-600 tabular-nums">
          {typeof cost === "number" ? formatClp(cost) : "—"}
        </p>
      </div>
    </div>
  );
}

function WeekProgressRing({
  used,
  budget,
}: {
  used: number;
  budget: number;
}) {
  const pct = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const over = used > budget;

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 72 72" aria-hidden>
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="6"
        />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={over ? "#fecaca" : "#a7f3d0"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums text-white">
        {pct}%
      </span>
    </div>
  );
}

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
        remaining: dailyBudget - dayTotal,
        overDaily: dayTotal > dailyBudget,
      };
    });
  }, [plan, dailyBudget]);

  const effectiveWeekBudget = weekBudget || dailyBudget * 7;
  const remainingWeek = effectiveWeekBudget - weekTotal;

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
          Menú visual · almuerzo y cena
          {source ? ` · ${source === "worker" ? "API" : source === "supabase" ? "Supabase" : "Demo"}` : ""}
          {saved ? " · guardado" : ""}
        </p>
      </div>

      {/* Cabecera flotante presupuesto + anillo */}
      {plan.length > 0 && (
        <div className="sticky top-[3.75rem] z-30 -mx-1 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-lg shadow-blue-600/25">
          <div className="flex items-center gap-4">
            <WeekProgressRing used={weekTotal} budget={effectiveWeekBudget} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">
                Presupuesto semanal
              </p>
              <p className="truncate text-xl font-bold tabular-nums">
                {formatClp(weekTotal)}
                <span className="ml-1 text-sm font-medium text-white/70">
                  / {formatClp(effectiveWeekBudget)}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-white/80">
                {remainingWeek >= 0
                  ? `Te quedan ${formatClp(remainingWeek)} esta semana`
                  : `Te pasaste ${formatClp(Math.abs(remainingWeek))}`}
                {" · "}
                Diario {formatClp(dailyBudget)}
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-4 rounded-3xl border border-blue-100 bg-blue-50/90 p-5 shadow-sm">
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
            Semanal
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
          className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-base font-bold text-white shadow-md transition enabled:hover:opacity-95 disabled:opacity-60"
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
        <p
          className={`text-sm font-medium ${
            withinBudget && !byDay.some((d) => d.overDaily)
              ? "text-emerald-700"
              : "text-amber-800"
          }`}
        >
          {withinBudget && !byDay.some((d) => d.overDaily)
            ? "Cada día (almuerzo + cena) cabe en tu presupuesto diario."
            : "Hay días fuera de presupuesto; ajusta el slider y regenera."}
        </p>
      )}

      {plan.length === 0 && !loading ? (
        <div className="rounded-3xl border border-dashed border-[var(--cs-line)] bg-white/60 p-8 text-center text-sm text-[var(--cs-muted)]">
          Fija tu presupuesto diario y genera un plan variado de Lunes a Domingo.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {byDay.map(({ day, almuerzo, cena, dayTotal, remaining, overDaily }) => (
            <section
              key={day}
              className={`flex flex-col rounded-3xl border bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm transition hover:shadow-md ${
                overDaily ? "border-amber-200" : "border-slate-100"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2 px-0.5">
                <h2 className="text-sm font-bold tracking-wide text-slate-800">{day}</h2>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold tabular-nums ${
                      overDaily ? "text-amber-700" : "text-emerald-600"
                    }`}
                  >
                    {formatClp(dayTotal)}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    {overDaily
                      ? `+${formatClp(Math.abs(remaining))} sobre tope`
                      : `${formatClp(remaining)} libres`}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2.5">
                <MealRow label="Almuerzo" slot={almuerzo} />
                <MealRow label="Cena" slot={cena} />
              </div>
            </section>
          ))}
        </div>
      )}

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

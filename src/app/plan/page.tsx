"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useChefSession } from "@/lib/chef-session";
import { buildWeekPlan, formatClp } from "@/lib/demo-data";

export default function PlanPage() {
  const { weekBudgetClp, setWeekBudgetClp } = useChefSession();
  const plan = useMemo(() => buildWeekPlan(weekBudgetClp), [weekBudgetClp]);
  const total = plan.reduce((sum, d) => sum + d.recipe.costClp, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--cs-brand)]">
          Plan semanal
        </h1>
        <p className="mt-2 text-sm text-[var(--cs-muted)]">
          Menú ajustado a tu presupuesto de la semana.
        </p>
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

      <ol className="space-y-2">
        {plan.map(({ day, recipe }) => (
          <li
            key={day}
            className="flex items-center gap-3 rounded-2xl border border-[var(--cs-line)] bg-[var(--cs-card)] px-4 py-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-brand)] text-xs font-bold text-white">
              {day}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[var(--cs-brand)]">{recipe.name}</p>
              <p className="text-xs text-[var(--cs-muted)]">
                {recipe.minutes} min · {recipe.difficulty}
              </p>
            </div>
            <span className="text-sm font-bold text-[var(--cs-accent)]">
              {formatClp(recipe.costClp)}
            </span>
          </li>
        ))}
      </ol>

      <Link
        href="/compras/"
        className="flex w-full items-center justify-center rounded-2xl bg-[var(--cs-brand)] px-5 py-4 text-base font-bold text-white"
      >
        Ver lista de compras
      </Link>
    </div>
  );
}

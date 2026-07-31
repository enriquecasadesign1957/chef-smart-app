"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useChefSession } from "@/lib/chef-session";
import { formatClp, suggestRecipes } from "@/lib/demo-data";

export default function RecetasPage() {
  const { budgetClp, pantryTokens, ingredientsText } = useChefSession();
  const recipes = useMemo(
    () => suggestRecipes(budgetClp, pantryTokens),
    [budgetClp, pantryTokens],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--cs-brand)]">
          Recetas sugeridas
        </h1>
        <p className="mt-2 text-sm text-[var(--cs-muted)]">
          Hasta {formatClp(budgetClp)} · con: {ingredientsText || "tu despensa"}
        </p>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--cs-line)] bg-white/60 p-6 text-center">
          <p className="font-semibold text-[var(--cs-brand)]">Sin coincidencias en este presupuesto</p>
          <p className="mt-2 text-sm text-[var(--cs-muted)]">Sube el monto o vuelve al inicio.</p>
          <Link href="/" className="mt-4 inline-block font-semibold text-[var(--cs-accent)]">
            Ajustar presupuesto →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {recipes.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-[var(--cs-line)] bg-[var(--cs-card)] p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--cs-brand)]">{r.name}</h2>
                  <p className="mt-1 text-sm text-[var(--cs-muted)]">
                    {r.difficulty} · {r.minutes} min
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--cs-mint)]/30 px-3 py-1 text-sm font-bold text-[var(--cs-brand)]">
                  {formatClp(r.costClp)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-[var(--cs-muted)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/plan/"
        className="flex w-full items-center justify-center rounded-2xl border-2 border-[var(--cs-brand)] px-5 py-3.5 text-base font-bold text-[var(--cs-brand)]"
      >
        Armar plan semanal
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRecipes } from "@/hooks/use-recipes";
import { useChefSession } from "@/lib/chef-session";
import { formatClp } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function RecetasPage() {
  const { budgetClp, pantryTokens, ingredientsText } = useChefSession();
  const { recipes, source, loading, error, search } = useRecipes();

  useEffect(() => {
    void search({ ingredients: pantryTokens, budget: budgetClp });
  }, [budgetClp, pantryTokens, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--cs-brand)]">
          Recetas sugeridas
        </h1>
        <p className="mt-2 text-sm text-[var(--cs-muted)]">
          Hasta {formatClp(budgetClp)} · con: {ingredientsText || "tu despensa"}
          {source ? (
            <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">
              {source === "supabase" ? "Supabase" : "Demo local"}
            </span>
          ) : null}
        </p>
        {!isSupabaseConfigured() && (
          <p className="mt-2 text-xs text-amber-800">
            Sin keys de Supabase: usando datos demo. Configura `.env.local` del proyecto chef_smart.
          </p>
        )}
      </div>

      {loading && <p className="text-sm text-[var(--cs-muted)]">Buscando recetas…</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && recipes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--cs-line)] bg-white/60 p-6 text-center">
          <p className="font-semibold text-[var(--cs-brand)]">Sin coincidencias en este presupuesto</p>
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
                    {r.difficulty} · {r.time} min
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--cs-mint)]/30 px-3 py-1 text-sm font-bold text-[var(--cs-brand)]">
                  {formatClp(r.cost)}
                </span>
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

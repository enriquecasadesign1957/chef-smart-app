"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeModal } from "@/components/recipe-modal";
import { fetchPantryRecipes, type PantryRecipe } from "@/lib/api/pantry";
import { useChefSession } from "@/lib/chef-session";

export default function RecetasPage() {
  const { ingredientsText, setIngredientsText, hydrated } = useChefSession();
  const [input, setInput] = useState("");
  const [recipes, setRecipes] = useState<PantryRecipe[]>([]);
  const [source, setSource] = useState<"worker" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<PantryRecipe | null>(null);

  useEffect(() => {
    if (hydrated) setInput(ingredientsText);
  }, [hydrated, ingredientsText]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) {
      setError("Escribe los ingredientes que tienes en casa.");
      return;
    }
    setIngredientsText(value);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetchPantryRecipes(value);
        setRecipes(res.recipes);
        setSource(res.source);
        setSearched(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron buscar recetas");
        setRecipes([]);
        setSearched(true);
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cs-accent)]">
          Modo Despensa / Refrigerador
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-[var(--cs-brand)]">
          Cocina con lo que ya tienes
        </h1>
        <p className="text-sm leading-relaxed text-[var(--cs-muted)]">
          Anota lo que hay en casa y te sugerimos recetas inmediatas. Sin precios ni
          presupuestos: solo aprovechar tu refrigerador.
        </p>
      </section>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-[1.75rem] border border-[var(--cs-line)] bg-white/75 p-5 shadow-[0_18px_40px_-28px_rgba(27,67,50,0.55)]"
      >
        <label htmlFor="pantry-ingredients" className="block text-sm font-semibold text-[var(--cs-brand)]">
          ¿Qué tienes en casa?
        </label>
        <textarea
          id="pantry-ingredients"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: huevos, tomates, cebolla"
          className="w-full resize-none rounded-2xl border border-[var(--cs-line)] bg-[var(--cs-card)] px-4 py-4 text-base leading-relaxed text-[var(--cs-ink)] outline-none ring-[var(--cs-mint)] placeholder:text-[var(--cs-muted)]/70 focus:ring-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-2xl bg-[var(--cs-brand)] px-5 py-4 text-base font-bold text-white transition enabled:hover:bg-[var(--cs-accent)] disabled:opacity-60"
        >
          {pending ? "Buscando…" : "Buscar Recetas Inmediatas"}
        </button>
      </form>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {pending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md"
            >
              <div className="h-48 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!pending && searched && recipes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--cs-line)] bg-white/60 p-6 text-center">
          <p className="font-semibold text-[var(--cs-brand)]">Sin recetas para esa despensa</p>
          <p className="mt-2 text-sm text-[var(--cs-muted)]">
            Prueba con más ingredientes o nombres más simples (ej. huevos, tomate).
          </p>
        </div>
      ) : null}

      {!pending && recipes.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--cs-brand)]">
              Ideas para ahora
            </h2>
            {source ? (
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[var(--cs-muted)]">
                {source === "worker" ? "API Worker" : "Demo local"}
              </span>
            ) : null}
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recipes.map((r) => (
              <li key={r.id ?? r.name}>
                <RecipeCard recipe={r} onOpen={() => setSelected(r)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {selected ? (
        <RecipeModal recipe={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

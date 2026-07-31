"use client";

import Link from "next/link";
import { useChefSession } from "@/lib/chef-session";
import { formatClp } from "@/lib/demo-data";

export default function HomePage() {
  const { ingredientsText, setIngredientsText, budgetClp, setBudgetClp } = useChefSession();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--cs-accent)]">
          Tu cocina, tu presupuesto
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-[var(--cs-brand)]">
          Chef Smart
        </h1>
        <p className="max-w-md text-base leading-relaxed text-[var(--cs-muted)]">
          Dinos qué tienes en la despensa y cuánto puedes gastar. Te sugerimos recetas, un plan
          semanal y la lista de compras.
        </p>
      </section>

      <section className="space-y-5 rounded-[1.75rem] border border-[var(--cs-line)] bg-[var(--cs-card)] p-5 shadow-[0_20px_50px_-28px_rgba(27,67,50,0.45)]">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--cs-brand)]">Ingredientes disponibles</span>
          <textarea
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            rows={4}
            placeholder="Ej: pollo, arroz, huevos, tomate…"
            className="w-full resize-none rounded-2xl border border-[var(--cs-line)] bg-white px-4 py-3 text-[var(--cs-ink)] outline-none ring-[var(--cs-mint)] focus:ring-2"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--cs-brand)]">
            Presupuesto por comida: {formatClp(budgetClp)}
          </span>
          <input
            type="range"
            min={2000}
            max={20000}
            step={500}
            value={budgetClp}
            onChange={(e) => setBudgetClp(Number(e.target.value))}
            className="w-full accent-[var(--cs-brand)]"
          />
          <div className="flex justify-between text-xs text-[var(--cs-muted)]">
            <span>$2.000</span>
            <span>$20.000</span>
          </div>
        </label>

        <Link
          href="/recetas/"
          className="flex w-full items-center justify-center rounded-2xl bg-[var(--cs-brand)] px-5 py-4 text-base font-bold text-white shadow-lg transition hover:opacity-95"
        >
          Ver recetas sugeridas
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/plan/"
          className="rounded-2xl border border-[var(--cs-line)] bg-white/70 p-4 transition hover:bg-white"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-muted)]">Plan</p>
          <p className="mt-1 font-semibold text-[var(--cs-brand)]">Menú semanal</p>
        </Link>
        <Link
          href="/compras/"
          className="rounded-2xl border border-[var(--cs-line)] bg-white/70 p-4 transition hover:bg-white"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-muted)]">
            Compras
          </p>
          <p className="mt-1 font-semibold text-[var(--cs-brand)]">Lista lista</p>
        </Link>
      </section>
    </div>
  );
}

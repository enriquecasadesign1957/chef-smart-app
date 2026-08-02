"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { optimizeWithSupermarket, type SmartProduct } from "@/lib/api/supermarket";
import { useChefSession } from "@/lib/chef-session";
import {
  DEMO_GROCERY,
  formatClp,
  type GroceryCategory,
  type GroceryItem,
} from "@/lib/demo-data";
import { supermarketProductUrl } from "@/lib/affiliate";

const ORDER: GroceryCategory[] = ["Verduras", "Proteínas", "Lácteos", "Abarrotes", "Otros"];

type ListItem = (GroceryItem | SmartProduct) & { url?: string };

export default function ComprasPage() {
  const { weekBudgetClp, pantryTokens } = useChefSession();
  const [storeUrl, setStoreUrl] = useState("https://www.santaisabel.cl/");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [optimized, setOptimized] = useState<SmartProduct[] | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [source, setSource] = useState<"worker" | "local" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const baseList: ListItem[] = useMemo(() => {
    return DEMO_GROCERY.map((item) => ({
      ...item,
      url: supermarketProductUrl(storeUrl || "https://www.santaisabel.cl/", item.name),
    }));
  }, [storeUrl]);

  const items: ListItem[] = optimized ?? baseList;

  const grouped = useMemo(() => {
    const map = new Map<GroceryCategory, ListItem[]>();
    for (const cat of ORDER) map.set(cat, []);
    for (const item of items) {
      map.get(item.category)?.push(item);
    }
    return ORDER.map((cat) => ({ cat, items: map.get(cat) ?? [] })).filter((g) => g.items.length);
  }, [items]);

  const total = items
    .filter((i) => !checked[i.id])
    .reduce((s, i) => s + i.estimatedClp, 0);

  function onOptimize(e: FormEvent) {
    e.preventDefault();
    const url = storeUrl.trim();
    if (!url) {
      setError("Pega la URL de tu supermercado (ej. Santa Isabel).");
      return;
    }
    try {
      new URL(url);
    } catch {
      setError("La URL no es válida.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await optimizeWithSupermarket({
          storeUrl: url,
          budget: Math.max(total, weekBudgetClp, 15000),
          items: pantryTokens.length
            ? pantryTokens
            : DEMO_GROCERY.map((i) => i.name),
        });
        setOptimized(res.products);
        setStoreName(res.storeName);
        setSource(res.source);
        setChecked({});
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo optimizar");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--cs-brand)]">
          Supermercado Smart
        </h1>
        <p className="mt-2 text-sm text-[var(--cs-muted)]">
          Lista categorizada + optimización con el súper que ya usas. Los enlaces incluyen
          tracking de afiliados.
        </p>
      </div>

      <form
        onSubmit={onOptimize}
        className="space-y-3 rounded-2xl border border-[var(--cs-line)] bg-white/80 p-4"
      >
        <label htmlFor="store-url" className="block text-sm font-semibold text-[var(--cs-brand)]">
          URL de tu supermercado
        </label>
        <input
          id="store-url"
          type="url"
          inputMode="url"
          placeholder="https://www.santaisabel.cl/..."
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          className="w-full rounded-2xl border border-[var(--cs-line)] bg-[var(--cs-card)] px-4 py-3 text-sm outline-none ring-[var(--cs-mint)] focus:ring-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-2xl bg-[var(--cs-brand)] px-5 py-3.5 text-base font-bold text-white disabled:opacity-60"
        >
          {pending ? "Optimizando…" : "Optimizar con mi Supermercado"}
        </button>
        {source && storeName ? (
          <p className="text-xs text-[var(--cs-muted)]">
            Resultados para <strong>{storeName}</strong>
            {source === "worker" ? " · API Worker" : " · local"}
          </p>
        ) : null}
      </form>

      {/* Banner de Alianza Comercial */}
      <aside className="relative overflow-hidden rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
        <span className="absolute right-3 top-3 rounded-full bg-yellow-200/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-900">
          Auspiciado
        </span>
        <p className="pr-20 text-sm font-semibold leading-snug text-yellow-950">
          ¡Ahorra un 15% extra en Santa Isabel pagando con tu tarjeta del mes!
        </p>
        <p className="mt-1 text-xs text-yellow-900/75">
          Alianza comercial Mi Menú Smart · oferta de ejemplo
        </p>
      </aside>

      <div className="rounded-2xl bg-[var(--cs-brand)] px-4 py-3 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          Pendiente estimado
        </p>
        <p className="text-2xl font-bold tabular-nums">{formatClp(total)}</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="space-y-5">
        {grouped.map(({ cat, items: catItems }) => (
          <section key={cat}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-accent)]">
              {cat}
            </h2>
            <ul className="space-y-2">
              {catItems.map((item) => {
                const done = Boolean(checked[item.id]);
                const href = item.url
                  ? item.url
                  : supermarketProductUrl(storeUrl, item.name);
                return (
                  <li key={item.id}>
                    <div
                      className={`flex items-center gap-3 rounded-2xl border border-[var(--cs-line)] px-4 py-3 ${
                        done ? "bg-white/40 opacity-60" : "bg-[var(--cs-card)]"
                      }`}
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() =>
                            setChecked((c) => ({ ...c, [item.id]: !c[item.id] }))
                          }
                          className="h-5 w-5 accent-[var(--cs-brand)]"
                        />
                        <span className={`min-w-0 flex-1 truncate font-medium ${done ? "line-through" : ""}`}>
                          {item.name}
                        </span>
                      </label>
                      <span className="shrink-0 text-sm font-semibold text-[var(--cs-muted)]">
                        {formatClp(item.estimatedClp)}
                      </span>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="shrink-0 rounded-xl bg-[var(--cs-mint)]/25 px-2.5 py-1 text-xs font-bold text-[var(--cs-brand)]"
                      >
                        Ver
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

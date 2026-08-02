"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { ProductCard } from "@/components/product-card";
import { SponsoredBanner } from "@/components/sponsored-banner";
import { supermarketProductUrl } from "@/lib/affiliate";
import { optimizeWithSupermarket, type SmartProduct } from "@/lib/api/supermarket";
import { useChefSession } from "@/lib/chef-session";
import {
  DEMO_GROCERY,
  formatClp,
  type GroceryCategory,
  type GroceryItem,
} from "@/lib/demo-data";

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
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-700">
          Pasillo virtual
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--cs-brand)]">
          Supermercado Smart
        </h1>
        <p className="mt-2 text-sm text-[var(--cs-muted)]">
          Recorre los pasillos por categoría. Cada “Agregar al Carro” abre tu súper con
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

      <SponsoredBanner storeUrl={storeUrl} />

      <div className="rounded-2xl bg-gradient-to-r from-purple-800 to-fuchsia-700 px-4 py-3 text-white shadow-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          Carro estimado (pendiente)
        </p>
        <p className="text-2xl font-extrabold tabular-nums">{formatClp(total)}</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="space-y-8">
        {grouped.map(({ cat, items: catItems }) => (
          <section key={cat}>
            <div className="mb-3 flex items-end justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--cs-accent)]">
                Pasillo · {cat}
              </h2>
              <span className="text-xs font-medium text-slate-400">
                {catItems.length} productos
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {catItems.map((item) => {
                const href = item.url
                  ? item.url
                  : supermarketProductUrl(storeUrl, item.name);
                return (
                  <li key={item.id}>
                    <ProductCard
                      name={item.name}
                      priceClp={item.estimatedClp}
                      href={href}
                      done={Boolean(checked[item.id])}
                      onToggleDone={() =>
                        setChecked((c) => ({ ...c, [item.id]: !c[item.id] }))
                      }
                    />
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

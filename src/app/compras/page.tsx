"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { ProductCard } from "@/components/product-card";
import {
  AFFILIATE_PARTNER,
  supermarketProductUrl,
  withAffiliateTracking,
} from "@/lib/affiliate";
import { optimizeWithSupermarket, type SmartProduct } from "@/lib/api/supermarket";
import { useChefSession } from "@/lib/chef-session";
import { DEMO_GROCERY, formatClp, type GroceryCategory } from "@/lib/demo-data";

const WORKER_URL =
  process.env.NEXT_PUBLIC_MENU_API_URL?.replace(/\/$/, "") ||
  "https://mi-menu-smart-api.enriquecasadesign.workers.dev";

const ORDER: GroceryCategory[] = ["Verduras", "Proteínas", "Lácteos", "Abarrotes", "Otros"];

export default function ComprasPage() {
  const { weekBudgetClp, pantryTokens } = useChefSession();
  const [storeUrl, setStoreUrl] = useState("https://www.santaisabel.cl/");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<SmartProduct[] | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [source, setSource] = useState<"worker" | "local" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);

  const displayProducts: SmartProduct[] = useMemo(() => {
    if (products?.length) return products;
    return DEMO_GROCERY.map((item) => ({
      ...item,
      url: supermarketProductUrl(storeUrl, item.name),
    }));
  }, [products, storeUrl]);

  const grouped = useMemo(() => {
    const map = new Map<GroceryCategory, SmartProduct[]>();
    for (const cat of ORDER) map.set(cat, []);
    for (const item of displayProducts) {
      map.get(item.category)?.push(item);
    }
    return ORDER.map((cat) => ({ cat, items: map.get(cat) ?? [] })).filter((g) => g.items.length);
  }, [displayProducts]);

  const total = displayProducts
    .filter((i) => !checked[i.id])
    .reduce((s, i) => s + i.estimatedClp, 0);

  const affiliateStoreUrl = withAffiliateTracking(
    storeUrl.trim() || "https://www.santaisabel.cl/",
  );

  function onOptimize(e: FormEvent) {
    e.preventDefault();
    const url = storeUrl.trim();
    if (!url) {
      setError("Pega la URL de tu supermercado (ej. https://www.santaisabel.cl/).");
      return;
    }
    try {
      new URL(url);
    } catch {
      setError("La URL no es válida.");
      return;
    }

    setError(null);
    setSearched(true);
    startTransition(async () => {
      try {
        // POST en vivo al Worker de producción
        const budget = Math.max(total || 0, weekBudgetClp || 0, 15000);
        const items = pantryTokens.length
          ? pantryTokens
          : DEMO_GROCERY.map((i) => i.name);

        const direct = await fetch(`${WORKER_URL}/supermarket/optimize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_url: url,
            budget,
            items,
          }),
        });

        if (direct.ok) {
          const data = (await direct.json()) as {
            store?: { name?: string };
            products?: {
              id: string;
              name: string;
              category: GroceryCategory;
              estimatedClp: number;
              url: string;
            }[];
          };
          const mapped: SmartProduct[] = (data.products ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            estimatedClp: p.estimatedClp,
            // Monetización: siempre ?partner=mimenusmart
            url: withAffiliateTracking(p.url || supermarketProductUrl(url, p.name)),
          }));
          setProducts(mapped);
          setStoreName(data.store?.name ?? "Supermercado");
          setSource("worker");
          setChecked({});
          return;
        }

        // Fallback helper (env / demo)
        const res = await optimizeWithSupermarket({
          storeUrl: url,
          budget,
          items,
        });
        setProducts(
          res.products.map((p) => ({
            ...p,
            url: withAffiliateTracking(p.url),
          })),
        );
        setStoreName(res.storeName);
        setSource(res.source);
        setChecked({});
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo optimizar el carrito");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-700">
          Motor comercial · partner={AFFILIATE_PARTNER}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--cs-brand)]">
          Supermercado Smart
        </h1>
        <p className="mt-2 text-sm text-[var(--cs-muted)]">
          Pega el link de tu súper, optimizamos el carrito con el Worker y cada compra lleva
          tracking de afiliados.
        </p>
      </div>

      {/* 1) Formulario de supermercado */}
      <form
        onSubmit={onOptimize}
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label htmlFor="store-url" className="block text-sm font-semibold text-slate-800">
          Enlace de tu supermercado preferido
        </label>
        <input
          id="store-url"
          type="url"
          inputMode="url"
          required
          placeholder="https://www.santaisabel.cl/..."
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none ring-purple-300 placeholder:text-slate-400 focus:ring-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-purple-700 to-fuchsia-600 px-5 py-4 text-base font-extrabold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
        >
          {pending ? "Optimizando…" : "Optimizar Carrito Smart"}
        </button>
        {source && storeName ? (
          <p className="text-xs text-slate-500">
            Vitrina: <strong>{storeName}</strong>
            {source === "worker" ? " · Worker en vivo" : " · modo local"}
            {" · "}
            {WORKER_URL.replace("https://", "")}
          </p>
        ) : null}
      </form>

      {/* 5) Banner auspiciado B2B */}
      <aside className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <span className="absolute right-3 top-3 rounded-full bg-amber-200/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
          Auspiciado
        </span>
        <p className="pr-24 text-base font-bold leading-snug text-amber-950">
          Auspiciado: ¡Ahorra un 15% extra en Santa Isabel usando tu tarjeta del mes!
        </p>
        <p className="mt-2 text-sm text-amber-900/80">
          Alianza comercial Mi Menú Smart · oferta B2B de ejemplo
        </p>
        <a
          href={affiliateStoreUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-4 inline-flex rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
        >
          Ver oferta del súper →
        </a>
      </aside>

      <div className="rounded-2xl bg-gradient-to-r from-purple-800 to-fuchsia-700 px-4 py-3 text-white shadow-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          Carro estimado
        </p>
        <p className="text-2xl font-extrabold tabular-nums">{formatClp(total)}</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {/* 2) Skeleton loader */}
      {pending && (
        <div className="space-y-4">
          <p className="text-center text-sm font-medium text-purple-800">
            Analizando pasillos y buscando alternativas económicas…
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div className="mx-auto mb-3 h-24 w-24 animate-pulse rounded-xl bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100" />
                <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="mb-3 h-5 w-1/3 animate-pulse rounded bg-purple-100" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 + 4) Vitrina e-commerce + afiliados */}
      {!pending && (
        <div className="space-y-8">
          {!searched && (
            <p className="text-center text-sm text-slate-500">
              Lista inicial de demo. Optimiza con tu URL para productos del Worker en vivo.
            </p>
          )}
          {grouped.map(({ cat, items }) => (
            <section key={cat}>
              <div className="mb-3 flex items-end justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--cs-accent)]">
                  Pasillo · {cat}
                </h2>
                <span className="text-xs font-medium text-slate-400">
                  {items.length} productos
                </span>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                  <li key={item.id}>
                    <ProductCard
                      name={item.name}
                      priceClp={item.estimatedClp}
                      href={withAffiliateTracking(
                        item.url || supermarketProductUrl(storeUrl, item.name),
                      )}
                      done={Boolean(checked[item.id])}
                      onToggleDone={() =>
                        setChecked((c) => ({ ...c, [item.id]: !c[item.id] }))
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

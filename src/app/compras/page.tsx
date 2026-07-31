"use client";

import { useMemo, useState } from "react";
import { DEMO_GROCERY, formatClp, type GroceryCategory } from "@/lib/demo-data";

const ORDER: GroceryCategory[] = ["Verduras", "Proteínas", "Lácteos", "Abarrotes", "Otros"];

export default function ComprasPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const map = new Map<GroceryCategory, typeof DEMO_GROCERY>();
    for (const cat of ORDER) map.set(cat, []);
    for (const item of DEMO_GROCERY) {
      map.get(item.category)?.push(item);
    }
    return ORDER.map((cat) => ({ cat, items: map.get(cat) ?? [] })).filter((g) => g.items.length);
  }, []);

  const total = DEMO_GROCERY.filter((i) => !checked[i.id]).reduce(
    (s, i) => s + i.estimatedClp,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--cs-brand)]">
          Lista de compras
        </h1>
        <p className="mt-2 text-sm text-[var(--cs-muted)]">
          Ingredientes faltantes por categoría. Marca lo que ya compraste.
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--cs-brand)] px-4 py-3 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Pendiente estimado</p>
        <p className="text-2xl font-bold">{formatClp(total)}</p>
      </div>

      <div className="space-y-5">
        {grouped.map(({ cat, items }) => (
          <section key={cat}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-accent)]">
              {cat}
            </h2>
            <ul className="space-y-2">
              {items.map((item) => {
                const done = Boolean(checked[item.id]);
                return (
                  <li key={item.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--cs-line)] px-4 py-3 ${
                        done ? "bg-white/40 opacity-60" : "bg-[var(--cs-card)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() =>
                          setChecked((c) => ({ ...c, [item.id]: !c[item.id] }))
                        }
                        className="h-5 w-5 accent-[var(--cs-brand)]"
                      />
                      <span className={`flex-1 font-medium ${done ? "line-through" : ""}`}>
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold text-[var(--cs-muted)]">
                        {formatClp(item.estimatedClp)}
                      </span>
                    </label>
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

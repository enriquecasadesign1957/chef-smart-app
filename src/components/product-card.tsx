"use client";

import { useEffect, useState } from "react";
import { productBrand, productImageUrl } from "@/lib/product-image";
import { formatClp } from "@/lib/demo-data";

export function ProductCard({
  name,
  priceClp,
  href,
  done,
  onToggleDone,
}: {
  name: string;
  priceClp: number;
  href: string;
  done: boolean;
  onToggleDone: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = productImageUrl(name);
  const brand = productBrand(name);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md ${
        done ? "opacity-55" : ""
      }`}
    >
      <div className="relative flex aspect-square items-center justify-center bg-white p-3">
        <button
          type="button"
          onClick={onToggleDone}
          className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-100"
          aria-pressed={done}
        >
          {done ? "Listo" : "Marcar"}
        </button>
        {!loaded && !failed && (
          <div className="absolute inset-3 animate-pulse rounded-xl bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50" />
        )}
        {failed ? (
          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-50 text-xs font-semibold text-slate-400">
            Producto
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`mx-auto mb-3 h-24 w-24 object-contain transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {brand}
        </p>
        <h3
          className={`mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-800 ${
            done ? "line-through" : ""
          }`}
        >
          {name}
        </h3>
        <p className="mt-2 text-xl font-extrabold tabular-nums text-purple-700">
          {formatClp(priceClp)}
        </p>

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-purple-700 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-fuchsia-700 hover:shadow-md"
        >
          <span aria-hidden>🛒</span>
          Agregar al Carro
        </a>
      </div>
    </article>
  );
}

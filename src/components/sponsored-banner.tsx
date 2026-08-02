"use client";

import { withAffiliateTracking } from "@/lib/affiliate";

export function SponsoredBanner({ storeUrl }: { storeUrl: string }) {
  const ctaHref = withAffiliateTracking(
    storeUrl.trim() || "https://www.santaisabel.cl/",
  );

  return (
    <aside className="relative overflow-hidden rounded-3xl shadow-lg shadow-red-900/15">
      {/* Fondo retail rojo/blanco */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-rose-800"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 10% 90%, rgba(0,0,0,0.2), transparent 40%)",
        }}
        aria-hidden
      />
      {/* Imagen sutil de pasillo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&h=500&q=60"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay"
        loading="lazy"
      />

      <div className="relative z-10 flex min-h-[11rem] flex-col justify-between gap-4 p-5 sm:min-h-[13rem] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-red-700 shadow-sm">
            Auspiciado
          </span>
          <span className="rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            Alianza Santa Isabel
          </span>
        </div>

        <div className="max-w-md">
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight text-white sm:text-3xl">
            ¡Ahorra un 15% extra en Santa Isabel!
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            Paga con tu tarjeta del mes y lleva tu lista Mi Menú Smart con
            descuento exclusivo en el pasillo.
          </p>
        </div>

        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ss-cta-pulse inline-flex w-fit items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-red-700 shadow-md transition hover:bg-red-50 hover:text-red-800"
        >
          Ir a la oferta →
        </a>
      </div>
    </aside>
  );
}

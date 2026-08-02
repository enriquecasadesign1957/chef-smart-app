"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Inicio", icon: "⌂" },
  { href: "/recetas/", label: "Despensa", icon: "◉" },
  { href: "/plan/", label: "Plan", icon: "▦" },
  { href: "/compras/", label: "Súper", icon: "☰" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--cs-bg)] text-[var(--cs-ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--cs-line)] bg-[color-mix(in_oklab,var(--cs-bg)_88%,white)] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--cs-brand)]">
              Mi Menú Smart
            </span>
          </Link>
          <span className="rounded-full bg-[var(--cs-mint)]/25 px-3 py-1 text-xs font-semibold text-[var(--cs-brand)]">
            Beta visual
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-28 pt-6">{children}</main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--cs-line)] bg-[color-mix(in_oklab,var(--cs-bg)_92%,white)] backdrop-blur-md"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pt-2">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.replace(/\/$/, ""));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-center transition ${
                    active
                      ? "bg-[var(--cs-brand)] text-white"
                      : "text-[var(--cs-muted)] hover:bg-black/5"
                  }`}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-semibold">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

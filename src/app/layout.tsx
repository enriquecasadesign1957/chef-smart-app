import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { RegisterServiceWorker } from "@/components/register-sw";
import { ChefProvider } from "@/lib/chef-session";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mi Menú Smart — Cocina inteligente con tu presupuesto",
  description:
    "Ingresa ingredientes y presupuesto. Recibe recetas, plan semanal y lista de compras.",
  applicationName: "Mi Menú Smart",
  appleWebApp: {
    capable: true,
    title: "Mi Menú Smart",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b4332",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ChefProvider>
          <RegisterServiceWorker />
          <AppShell>{children}</AppShell>
        </ChefProvider>
      </body>
    </html>
  );
}

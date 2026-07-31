"use client";

import { useEffect } from "react";

/** Registra service worker para instalación PWA (Safari / Chrome). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* silencioso en preview */
    });
  }, []);
  return null;
}

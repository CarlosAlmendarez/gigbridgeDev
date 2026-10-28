"use client";

import { useEffect } from "react";

/**
 * Registra public/sw.js una vez montada la app. Solo en producción: en
 * `next dev` un service worker activo sirve respuestas viejas y confunde
 * el hot reload. `updateViaCache: "none"` + el Cache-Control de
 * next.config.ts hacen que una versión nueva de sw.js se tome de inmediato.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((err) => {
      console.error("No se pudo registrar el service worker", err);
    });
  }, []);

  return null;
}

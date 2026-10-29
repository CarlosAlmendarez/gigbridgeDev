"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

/**
 * Sin conexión (ver public/sw.js):
 * - Franja que avisa que se está viendo la última copia guardada.
 * - Con red, precarga en segundo plano las secciones de la fecha abierta y
 *   de la siguiente, para que estén disponibles en el foro aunque no se
 *   hayan abierto. Una vez por fecha cada 30 min, para no cargar de más.
 */

const SECTIONS_TODAY = ["dia", "show", "lugar", "equipo/crew", "equipo/ubicaciones", "equipo/contactos"];
const SECTIONS_NEXT = ["dia", "show", "lugar"];
const WARM_EVERY_MS = 30 * 60 * 1000;

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function TourOffline({ dateId, nextDateId }: { dateId: string; nextDateId: string | null }) {
  const t = useTranslations("tour");
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

  useEffect(() => {
    if (!online || !navigator.serviceWorker?.controller) return;
    const key = `gb-warm-${dateId}`;
    try {
      if (Date.now() - Number(sessionStorage.getItem(key) ?? 0) < WARM_EVERY_MS) return;
    } catch {
      // Sin sessionStorage (modo privado): precarga igual, no es crítico.
    }
    const urls = [
      ...SECTIONS_TODAY.map((s) => `/tour/${dateId}/${s}`),
      ...(nextDateId ? SECTIONS_NEXT.map((s) => `/tour/${nextDateId}/${s}`) : []),
    ].filter((u) => u !== window.location.pathname);
    let cancelled = false;
    const timer = setTimeout(async () => {
      // En serie y con la página ya cargada: no compite con lo que el usuario ve.
      for (const url of urls) {
        if (cancelled) return;
        await fetch(url, { headers: { Accept: "text/html" }, credentials: "same-origin" }).catch(() => {});
      }
      // Se marca al terminar: si el usuario cambia de página a media
      // precarga, la siguiente vez se vuelve a intentar.
      try {
        sessionStorage.setItem(key, String(Date.now()));
      } catch {
        // ver arriba
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [online, dateId, nextDateId]);

  if (online) return null;
  return (
    <div role="status" className="sticky top-0 z-30 bg-accent-2 text-bg text-sm px-4 py-2">
      {t("sync.offlineBanner")}
    </div>
  );
}

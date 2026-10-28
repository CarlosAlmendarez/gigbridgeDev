"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { PARTIES, TABS } from "@gigbridge/config";
import { logout } from "@/lib/actions/auth";
import { navClass, chipClass } from "@/lib/ui";
import type { PartyKey, RosterPerson } from "@gigbridge/types";

const TAB_ROUTE: Record<string, string> = {
  hoy: "dia",
  show: "show",
  lugar: "lugar",
  equipo: "equipo/crew",
  club: "club",
};

export function Sidebar({ roster }: { roster: RosterPerson[] }) {
  const pathname = usePathname();
  const params = useParams<{ dateId: string }>();
  const dateId = params.dateId;
  const { lens, setLens, night, toggleNight, summary, source } = useTourUI();
  // En teléfono las opciones (party, modo noche, sesión) van plegadas para
  // que el contenido aparezca sin tener que bajar por toda la barra.
  const [optionsOpen, setOptionsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const currentSection = pathname.split("/")[3];
  // /rider es parte de la hoja del día (documentos de la fecha).
  const activeTabId = currentSection === "dia" || currentSection === "rider" ? "hoy" : currentSection;

  const lensed = lens === "Todos" ? roster : roster.filter((p) => p.party === lens);
  const onSite = lensed.filter((p) => p.onSite).length;
  const lensLine = `${lensed.length} ${lensed.length === 1 ? "persona" : "personas"} · ${onSite} ${
    source === "supabase" ? "confirmadas" : "en sitio"
  }`;

  const lenses: Array<"Todos" | PartyKey> = ["Todos", "A", "B", "C"];

  // En teléfono el menú es una fila con scroll: la sección activa se trae a
  // la vista para que siempre se sepa dónde se está.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeTabId]);

  return (
    <div className="md:sticky md:top-0 md:self-start md:h-screen md:overflow-y-auto px-4 pt-6 pb-2 md:pb-6 flex flex-col gap-4 md:gap-6">
      <div className="flex items-start gap-2">
        <div className="min-w-0 mr-auto">
          {source === "supabase" && (
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-neutral-700 mb-1">
              <Icon name="house" size={14} />
              Mis giras
            </Link>
          )}
          <div className="font-heading font-semibold text-xl tracking-[-0.02em]">{summary.name}</div>
          <div className="text-[13px] italic text-neutral-700">{summary.bandLine}</div>
        </div>
        <button
          type="button"
          className="btn btn-secondary min-h-10 text-xs md:hidden"
          aria-expanded={optionsOpen}
          onClick={() => setOptionsOpen((o) => !o)}
        >
          Opciones
          <Icon name={optionsOpen ? "caret-up" : "caret-down"} size={14} />
        </button>
      </div>

      <nav ref={navRef} aria-label="Secciones de la fecha" className="flex flex-row md:flex-col gap-1 md:gap-0.5 overflow-x-auto -mx-1 px-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/tour/${dateId}/${TAB_ROUTE[t.id]}`}
            aria-current={activeTabId === t.id ? "page" : undefined}
            className={navClass(activeTabId === t.id) + " flex-none md:w-full"}
          >
            <Icon name={t.icon} size={20} />
            <span className="text-[15px] font-heading font-semibold whitespace-nowrap">{t.label}</span>
          </Link>
        ))}
      </nav>

      <div className={(optionsOpen ? "flex" : "hidden") + " md:flex flex-col gap-6 md:flex-1"}>
        <div>
          <div className="text-[11px] tracking-[0.1em] uppercase text-neutral-700 mb-1">Ver por party</div>
          <p className="text-xs text-neutral-700 mb-2 leading-relaxed">
            Filtra la gente que ves en la hoja del día y en Equipo. No cambia permisos.
          </p>
          <div className="flex flex-col gap-1">
            {lenses.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setLens(k)}
                aria-pressed={lens === k}
                className={chipClass(lens === k, true) + " text-left whitespace-normal justify-start"}
              >
                {k === "Todos" ? "Toda la gira" : PARTIES[k].name.replace(`Party ${k} · `, `Party ${k} — `)}
              </button>
            ))}
          </div>
          <div className="text-xs text-neutral-700 mt-2 leading-relaxed">{lensLine}</div>
        </div>

        <div className="md:mt-auto flex flex-col items-start gap-1">
          <button
            type="button"
            onClick={toggleNight}
            className="btn btn-ghost min-h-10 text-xs tracking-[0.08em] uppercase gap-[7px] pl-0"
          >
            <Icon name="moon-stars" size={18} />
            {night ? "Modo día" : "Modo noche"}
          </button>
          {source === "supabase" ? (
            <form action={logout}>
              <button type="submit" className="btn btn-ghost min-h-10 text-xs tracking-[0.08em] uppercase gap-[7px] pl-0">
                <Icon name="sign-out" size={18} />
                Cerrar sesión
              </button>
            </form>
          ) : (
            <p className="text-xs text-neutral-700 leading-relaxed">
              Gira de ejemplo: los cambios que hagas aquí no se guardan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

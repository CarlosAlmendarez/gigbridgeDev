"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { TOUR_NAME, BAND_LINE } from "@gigbridge/data";
import { PARTIES, TABS } from "@gigbridge/config";
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
  const { lens, setLens, night, toggleNight } = useTourUI();

  const currentSection = pathname.split("/")[3];
  const activeTabId = currentSection === "dia" ? "hoy" : currentSection;

  const lensed = lens === "Todos" ? roster : roster.filter((p) => p.party === lens);
  const onSite = lensed.filter((p) => p.onSite).length;
  const lensLine =
    lens === "Todos"
      ? `${roster.length} personas · ${onSite} en sitio hoy`
      : `${lensed.length} personas · ${onSite} en sitio hoy`;

  const lenses: Array<"Todos" | PartyKey> = ["Todos", "A", "B", "C"];

  return (
    <div className="md:sticky md:top-0 md:self-start md:h-screen md:overflow-y-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <div className="font-heading font-semibold text-xl tracking-[-0.02em]">{TOUR_NAME}</div>
        <div className="text-[13px] italic text-neutral-700">{BAND_LINE}</div>
      </div>

      <div className="flex flex-col gap-0.5">
        {TABS.map((t) => (
          <Link key={t.id} href={`/tour/${dateId}/${TAB_ROUTE[t.id]}`} className={navClass(activeTabId === t.id)}>
            <Icon name={t.icon} size={20} />
            <span className="text-[15px] font-heading font-semibold">{t.label}</span>
          </Link>
        ))}
      </div>

      <div>
        <div className="text-[11px] tracking-[0.1em] uppercase text-neutral-700 mb-2">Enfoque</div>
        <div className="flex flex-col gap-1">
          {lenses.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setLens(k)}
              className={chipClass(lens === k, true) + " text-left whitespace-normal justify-start"}
            >
              {k === "Todos" ? "Toda la gira" : PARTIES[k].name.replace(`Party ${k} · `, `Party ${k} — `)}
            </button>
          ))}
        </div>
        <div className="text-xs text-neutral-700 mt-2 leading-relaxed">{lensLine}</div>
      </div>

      <div className="mt-auto">
        <button
          type="button"
          onClick={toggleNight}
          className="btn btn-ghost min-h-10 text-xs tracking-[0.08em] uppercase gap-[7px] pl-0"
        >
          <Icon name="moon-stars" size={18} />
          {night ? "Modo día" : "Modo noche"}
        </button>
      </div>
    </div>
  );
}

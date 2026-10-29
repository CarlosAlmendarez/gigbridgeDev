"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useTourUI } from "@/context/TourUIContext";
import { TABS } from "@gigbridge/config";
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
  const t = useTranslations("tour");
  // En teléfono las opciones (party, modo noche, sesión) van plegadas para
  // que el contenido aparezca sin tener que bajar por toda la barra.
  const [optionsOpen, setOptionsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const currentSection = pathname.split("/")[3];
  // /rider es parte de la hoja del día (documentos de la fecha).
  const activeTabId = currentSection === "dia" || currentSection === "rider" ? "hoy" : currentSection;

  const lensed = lens === "Todos" ? roster : roster.filter((p) => p.party === lens);
  const onSite = lensed.filter((p) => p.onSite).length;
  const lensLine = t("sidebar.lensLine", { count: lensed.length, onSite, live: String(source === "supabase") });

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
              {t("sidebar.myTours")}
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
          {t("sidebar.options")}
          <Icon name={optionsOpen ? "caret-up" : "caret-down"} size={14} />
        </button>
      </div>

      <nav ref={navRef} aria-label={t("sidebar.sectionsLabel")} className="flex flex-row md:flex-col gap-1 md:gap-0.5 overflow-x-auto -mx-1 px-1">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/tour/${dateId}/${TAB_ROUTE[tab.id]}`}
            aria-current={activeTabId === tab.id ? "page" : undefined}
            className={navClass(activeTabId === tab.id) + " flex-none md:w-full"}
          >
            <Icon name={tab.icon} size={20} />
            <span className="text-[15px] font-heading font-semibold whitespace-nowrap">{t(`tabs.${tab.id}`)}</span>
          </Link>
        ))}
      </nav>

      <div className={(optionsOpen ? "flex" : "hidden") + " md:flex flex-col gap-6 md:flex-1"}>
        <div>
          <div className="text-[11px] tracking-[0.1em] uppercase text-neutral-700 mb-1">{t("sidebar.lensTitle")}</div>
          <p className="text-xs text-neutral-700 mb-2 leading-relaxed">
            {t("sidebar.lensHelp")}
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
                {k === "Todos" ? t("sidebar.lensAll") : t(`parties.${k}.name`).replace(" · ", " — ")}
              </button>
            ))}
          </div>
          <div className="text-xs text-neutral-700 mt-2 leading-relaxed">{lensLine}</div>
        </div>

        <div className="md:mt-auto flex flex-col items-start gap-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-neutral-700">{t("sidebar.language")}</span>
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            onClick={toggleNight}
            className="btn btn-ghost min-h-10 text-xs tracking-[0.08em] uppercase gap-[7px] pl-0"
          >
            <Icon name="moon-stars" size={18} />
            {night ? t("sidebar.nightOff") : t("sidebar.nightOn")}
          </button>
          {source === "supabase" ? (
            <form action={logout}>
              <button type="submit" className="btn btn-ghost min-h-10 text-xs tracking-[0.08em] uppercase gap-[7px] pl-0">
                <Icon name="sign-out" size={18} />
                {t("sidebar.signOut")}
              </button>
            </form>
          ) : (
            <p className="text-xs text-neutral-700 leading-relaxed">
              {t("sidebar.demoNote")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

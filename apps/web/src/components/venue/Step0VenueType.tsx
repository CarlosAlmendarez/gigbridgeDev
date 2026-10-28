"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import type { VenueRow } from "@gigbridge/types";

type VenueType = "live_venue" | "rehearsal_studio" | "hybrid";

interface Props {
  venueId: string | null;
  initialData?: Partial<VenueRow>;
  onSaved: (venueId: string, data: Partial<VenueRow>) => void;
}

/**
 * A diferencia de v1, rehearsal_studio/hybrid quedan deshabilitados
 * ("próximamente") — sus steps (StepRehearsalDetails, StepRooms) no se
 * portaron todavía en este plan (quedan para cuando se diseñe el patrón
 * de UI de documentos por sala). Solo live_venue arma un wizard completo.
 */
const TYPE_OPTIONS: { value: VenueType; icon: string; labelKey: string; descKey: string; disabled: boolean }[] = [
  { value: "live_venue", icon: "buildings", labelKey: "typeLiveLabel", descKey: "typeLiveDesc", disabled: false },
  { value: "rehearsal_studio", icon: "music-notes", labelKey: "typeRehearsalLabel", descKey: "typeRehearsalDesc", disabled: true },
  { value: "hybrid", icon: "stack", labelKey: "typeHybridLabel", descKey: "typeHybridDesc", disabled: true },
];

export function Step0VenueType({ venueId, initialData, onSaved }: Props) {
  const t = useTranslations("venue_wizard");
  const [selected, setSelected] = useState<VenueType>((initialData?.venue_type as VenueType | undefined) ?? "live_venue");
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (venueId) {
      startTransition(async () => {
        await fetch("/api/venues/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueId, venue_type: selected }),
        });
        onSaved(venueId, { venue_type: selected });
      });
    } else {
      onSaved("", { venue_type: selected });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-sm font-bold">{t("typeTitle")}</p>
        <p className="text-xs text-neutral-600">{t("typeSubtitle")}</p>
      </div>

      <div className="flex flex-col gap-3">
        {TYPE_OPTIONS.map(({ value, icon, labelKey, descKey, disabled }) => {
          const active = selected === value;
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(value)}
              className={[
                "flex items-start gap-4 rounded-md border p-4 text-left transition-colors",
                active ? "border-accent bg-accent-100" : "border-divider bg-transparent",
                disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
              ].join(" ")}
            >
              <div className={["flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md", active ? "bg-accent-200" : "bg-surface"].join(" ")}>
                <Icon name={icon} size={20} className={active ? "text-accent-800" : "text-neutral-600"} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{t(labelKey as Parameters<typeof t>[0])}</p>
                  {active && (
                    <span className="rounded-full bg-accent-200 px-2 py-0.5 text-[10px] font-bold text-accent-800">
                      {t("typeSelected")}
                    </span>
                  )}
                  {disabled && (
                    <span className="rounded-full border border-divider bg-surface px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-neutral-600">
                      Próximamente
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-neutral-600">{t(descKey as Parameters<typeof t>[0])}</p>
              </div>
            </button>
          );
        })}
      </div>

      <button type="button" onClick={handleConfirm} disabled={isPending} className="btn btn-primary btn-block">
        {isPending ? t("wizSaving") : t("wizContinue")}
      </button>
    </div>
  );
}

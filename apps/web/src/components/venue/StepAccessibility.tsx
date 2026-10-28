"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { VenueStepActions } from "@/components/venue/VenueStepActions";
import type { ParkingAvailability, VenueRow } from "@gigbridge/types";

interface FormData {
  has_loading_dock: boolean;
  ground_floor_access: boolean;
  parking_availability: string;
  has_green_room: boolean;
  wifi_speed_mbps: number | "";
  has_private_restroom: boolean;
  wheelchair_accessible: boolean;
  accessible_restroom: boolean;
  accessibility_notes: string;
}

interface Props {
  venueId: string;
  initialData?: Partial<VenueRow>;
  onSaved: (venueId: string, data: Partial<VenueRow>) => void;
  onBack: () => void;
}

export function StepAccessibility({ venueId, initialData, onSaved, onBack }: Props) {
  const t = useTranslations("venue_wizard");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      has_loading_dock: initialData?.has_loading_dock ?? false,
      ground_floor_access: initialData?.ground_floor_access ?? true,
      parking_availability: initialData?.parking_availability ?? "",
      has_green_room: initialData?.has_green_room ?? false,
      wifi_speed_mbps: initialData?.wifi_speed_mbps ?? "",
      has_private_restroom: initialData?.has_private_restroom ?? false,
      wheelchair_accessible: initialData?.wheelchair_accessible ?? false,
      accessible_restroom: initialData?.accessible_restroom ?? false,
      accessibility_notes: initialData?.accessibility_notes ?? "",
    },
  });

  function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const payload = {
        has_loading_dock: data.has_loading_dock,
        ground_floor_access: data.ground_floor_access,
        parking_availability: (data.parking_availability as ParkingAvailability) || null,
        has_green_room: data.has_green_room,
        wifi_speed_mbps: data.wifi_speed_mbps !== "" ? Number(data.wifi_speed_mbps) : null,
        has_private_restroom: data.has_private_restroom,
        wheelchair_accessible: data.wheelchair_accessible,
        accessible_restroom: data.accessible_restroom,
        accessibility_notes: data.accessibility_notes || null,
      };
      const res = await fetch("/api/venues/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, ...payload }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? t("wizErrorSave"));
        return;
      }
      onSaved(venueId, payload);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <p className="mb-3 text-sm font-bold">{t("sAccLoadTitle")}</p>
        <div className="flex flex-col gap-3">
          {([
            { key: "has_loading_dock", labelKey: "sAccLoadDock" },
            { key: "ground_floor_access", labelKey: "sAccGroundFloor" },
          ] as const).map(({ key, labelKey }) => (
            <label key={key} className="flex items-center gap-3">
              <input type="checkbox" {...register(key)} className="h-4 w-4 accent-accent" />
              <span className="text-sm text-neutral-700">{t(labelKey)}</span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("sAccParking")}</label>
          <select {...register("parking_availability")} className="input">
            <option value="">{t("sAccParkingNone2")}</option>
            <option value="none">{t("sAccParkingNoParking")}</option>
            <option value="street">{t("sAccParkingStreet")}</option>
            <option value="private_lot">{t("sAccParkingPrivate")}</option>
            <option value="van_trailer_accessible">{t("sAccParkingVan")}</option>
          </select>
        </div>
      </div>

      <div className="border-t border-divider pt-4">
        <p className="mb-3 text-sm font-bold">{t("sAccBackstageTitle")}</p>
        <div className="mb-3 flex flex-col gap-3">
          {([
            { key: "has_green_room", labelKey: "sAccGreenRoom" },
            { key: "has_private_restroom", labelKey: "sAccPrivateRestroom" },
          ] as const).map(({ key, labelKey }) => (
            <label key={key} className="flex items-center gap-3">
              <input type="checkbox" {...register(key)} className="h-4 w-4 accent-accent" />
              <span className="text-sm text-neutral-700">{t(labelKey)}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("sAccWifi")}</label>
          <input type="number" min={0} {...register("wifi_speed_mbps")} placeholder="100" className="input" />
          <p className="mt-1 text-xs text-neutral-600">{t("sAccWifiHint")}</p>
        </div>
      </div>

      <div className="border-t border-divider pt-4">
        <p className="mb-3 text-sm font-bold">{t("sAccA11yTitle")}</p>
        <div className="mb-3 flex flex-col gap-3">
          {([
            { key: "wheelchair_accessible", labelKey: "sAccWheelchair" },
            { key: "accessible_restroom", labelKey: "sAccA11yRestroom" },
          ] as const).map(({ key, labelKey }) => (
            <label key={key} className="flex items-center gap-3">
              <input type="checkbox" {...register(key)} className="h-4 w-4 accent-accent" />
              <span className="text-sm text-neutral-700">{t(labelKey)}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("sAccA11yNotes")}</label>
          <textarea rows={2} {...register("accessibility_notes")} placeholder={t("sAccA11yNotesPh")} className="input" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <VenueStepActions onBack={onBack} pending={isPending} />
    </form>
  );
}

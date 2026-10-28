"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { VenueStepActions } from "@/components/venue/VenueStepActions";
import type { VenueRow } from "@gigbridge/types";

interface FormData {
  capacity: number | "";
  stage_width_m: number | "";
  stage_depth_m: number | "";
  stage_height_m: number | "";
  stage_surface: string;
  stage_load_kg_per_m2: number | "";
  stage_notes: string;
  power_outlets_stage: number | "";
  power_voltage: number;
  has_ground_connection: boolean;
  has_backup_generator: boolean;
  power_notes: string;
}

interface Props {
  venueId: string;
  initialData?: Partial<VenueRow>;
  onSaved: (venueId: string, data: Partial<VenueRow>) => void;
  onBack: () => void;
}

const SURFACE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "Madera", labelKey: "s2SurfaceWood" },
  { value: "Concreto", labelKey: "s2SurfaceConcrete" },
  { value: "Tarima metálica", labelKey: "s2SurfaceMetal" },
  { value: "Alfombra", labelKey: "s2SurfaceCarpet" },
  { value: "Vinilo", labelKey: "s2SurfaceVinyl" },
  { value: "Otro", labelKey: "s2SurfaceOther" },
];

export function Step2Stage({ venueId, initialData, onSaved, onBack }: Props) {
  const t = useTranslations("venue_wizard");
  const isRehearsalStudio = initialData?.venue_type === "rehearsal_studio";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      capacity: initialData?.capacity ?? "",
      stage_width_m: initialData?.stage_width_m ?? "",
      stage_depth_m: initialData?.stage_depth_m ?? "",
      stage_height_m: initialData?.stage_height_m ?? "",
      stage_surface: initialData?.stage_surface ?? "",
      stage_load_kg_per_m2: initialData?.stage_load_kg_per_m2 ?? "",
      stage_notes: initialData?.stage_notes ?? "",
      power_outlets_stage: initialData?.power_outlets_stage ?? "",
      power_voltage: initialData?.power_voltage ?? 127,
      has_ground_connection: initialData?.has_ground_connection ?? false,
      has_backup_generator: initialData?.has_backup_generator ?? false,
      power_notes: initialData?.power_notes ?? "",
    },
  });

  function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const payload = {
        capacity: data.capacity !== "" ? Number(data.capacity) : null,
        stage_width_m: data.stage_width_m !== "" ? Number(data.stage_width_m) : null,
        stage_depth_m: data.stage_depth_m !== "" ? Number(data.stage_depth_m) : null,
        stage_height_m: data.stage_height_m !== "" ? Number(data.stage_height_m) : null,
        stage_surface: data.stage_surface || null,
        stage_load_kg_per_m2: data.stage_load_kg_per_m2 !== "" ? Number(data.stage_load_kg_per_m2) : null,
        stage_notes: data.stage_notes || null,
        power_outlets_stage: data.power_outlets_stage !== "" ? Number(data.power_outlets_stage) : 0,
        power_voltage: Number(data.power_voltage),
        has_ground_connection: data.has_ground_connection,
        has_backup_generator: data.has_backup_generator,
        power_notes: data.power_notes || null,
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {!isRehearsalStudio && (
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s2Capacity")}</label>
          <input type="number" min={1} {...register("capacity")} placeholder="500" className="input" />
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-bold">{t("s2StageTitle")}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([
            { key: "stage_width_m", labelKey: "s2Width" },
            { key: "stage_depth_m", labelKey: "s2Depth" },
            { key: "stage_height_m", labelKey: "s2Height" },
          ] as const).map(({ key, labelKey }) => (
            <div key={key}>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t(labelKey)}</label>
              <input type="number" step="0.1" min={0} {...register(key)} placeholder="0.0" className="input" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s2Surface")}</label>
          <select {...register("stage_surface")} className="input">
            <option value="">{t("s2SurfaceSelect")}</option>
            {SURFACE_OPTIONS.map(({ value, labelKey }) => (
              <option key={value} value={value}>
                {t(labelKey as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s2MaxLoad")}</label>
          <input type="number" min={0} {...register("stage_load_kg_per_m2")} placeholder="500" className="input" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s2StageNotes")}</label>
        <textarea rows={2} {...register("stage_notes")} placeholder={t("s2StageNotesPh")} className="input" />
      </div>

      <div>
        <p className="mb-3 text-sm font-bold">{t("s2ElecTitle")}</p>
        <div className="mb-3 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s2Outlets")}</label>
            <input type="number" min={0} {...register("power_outlets_stage")} placeholder="8" className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s2Voltage")}</label>
            <select {...register("power_voltage", { valueAsNumber: true })} className="input">
              <option value={127}>{t("s2V127")}</option>
              <option value={220}>{t("s2V220")}</option>
              <option value={110}>{t("s2V110")}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {([
            { key: "has_ground_connection", labelKey: "s2Ground" },
            { key: "has_backup_generator", labelKey: "s2Generator" },
          ] as const).map(({ key, labelKey }) => (
            <label key={key} className="flex items-center gap-3">
              <input type="checkbox" {...register(key)} className="h-4 w-4 accent-accent" />
              <span className="text-sm text-neutral-700">{t(labelKey)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s2PowerNotes")}</label>
        <textarea rows={2} {...register("power_notes")} placeholder={t("s2PowerNotesPh")} className="input" />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <VenueStepActions onBack={onBack} pending={isPending} />
    </form>
  );
}

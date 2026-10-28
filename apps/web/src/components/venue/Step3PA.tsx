"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FOH_BRAND_MODELS, FOH_CONSOLE_BRANDS, FOH_CONSOLE_MODELS, PA_BRANDS, PA_BRAND_MODELS, PA_MODELS } from "@gigbridge/config";
import { VenueStepActions } from "@/components/venue/VenueStepActions";
import type { VenueRow } from "@gigbridge/types";

interface FormData {
  has_pa: boolean;
  pa_brand: string;
  pa_model: string;
  pa_watts: number | "";
  pa_max_db: number | "";
  has_frontfills: boolean;
  has_outfills: boolean;
  has_subwoofers: boolean;
  pa_notes: string;
  has_foh_console: boolean;
  foh_console_brand: string;
  foh_console_model: string;
  foh_console_type: "analog" | "digital" | "";
  foh_console_channels: number | "";
  foh_console_outputs: number | "";
  foh_max_distance_m: number | "";
}

interface Props {
  venueId: string;
  initialData?: Partial<VenueRow>;
  onSaved: (venueId: string, data: Partial<VenueRow>) => void;
  onBack: () => void;
}

export function Step3PA({ venueId, initialData, onSaved, onBack }: Props) {
  const t = useTranslations("venue_wizard");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      has_pa: initialData?.has_pa ?? false,
      pa_brand: initialData?.pa_brand ?? "",
      pa_model: initialData?.pa_model ?? "",
      pa_watts: initialData?.pa_watts ?? "",
      pa_max_db: initialData?.pa_max_db ?? "",
      has_frontfills: initialData?.has_frontfills ?? false,
      has_outfills: initialData?.has_outfills ?? false,
      has_subwoofers: initialData?.has_subwoofers ?? false,
      pa_notes: initialData?.pa_notes ?? "",
      has_foh_console: initialData?.has_foh_console ?? false,
      foh_console_brand: initialData?.foh_console_brand ?? "",
      foh_console_model: initialData?.foh_console_model ?? "",
      foh_console_type: initialData?.foh_console_type ?? "",
      foh_console_channels: initialData?.foh_console_channels ?? "",
      foh_console_outputs: initialData?.foh_console_outputs ?? "",
      foh_max_distance_m: initialData?.foh_max_distance_m ?? "",
    },
  });

  const hasPa = watch("has_pa");
  const hasFoh = watch("has_foh_console");
  const selectedPaBrand = watch("pa_brand");
  const selectedFohBrand = watch("foh_console_brand");

  const filteredPaModels = (selectedPaBrand && PA_BRAND_MODELS[selectedPaBrand]) || PA_MODELS;
  const filteredFohModels = (selectedFohBrand && FOH_BRAND_MODELS[selectedFohBrand]) || FOH_CONSOLE_MODELS;

  function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const payload = {
        has_pa: data.has_pa,
        pa_brand: data.pa_brand || null,
        pa_model: data.pa_model || null,
        pa_watts: data.pa_watts !== "" ? Number(data.pa_watts) : null,
        pa_max_db: data.pa_max_db !== "" ? Number(data.pa_max_db) : null,
        has_frontfills: data.has_frontfills,
        has_outfills: data.has_outfills,
        has_subwoofers: data.has_subwoofers,
        pa_notes: data.pa_notes || null,
        has_foh_console: data.has_foh_console,
        foh_console_brand: data.foh_console_brand || null,
        foh_console_model: data.foh_console_model || null,
        foh_console_type: data.foh_console_type || null,
        foh_console_channels: data.foh_console_channels !== "" ? Number(data.foh_console_channels) : null,
        foh_console_outputs: data.foh_console_outputs !== "" ? Number(data.foh_console_outputs) : null,
        foh_max_distance_m: data.foh_max_distance_m !== "" ? Number(data.foh_max_distance_m) : null,
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
      <div>
        <label className="mb-4 flex items-center gap-3">
          <input type="checkbox" {...register("has_pa")} className="h-4 w-4 accent-accent" />
          <span className="text-sm font-semibold">{t("s3HasPA")}</span>
        </label>

        {hasPa && (
          <div className="flex flex-col gap-4 pl-7">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3Brand")}</label>
                <input {...register("pa_brand")} placeholder="d&b Audiotechnik" list="catalog-pa-brand" className="input" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3Model")}</label>
                <input {...register("pa_model")} placeholder="Y10P" list="catalog-pa-model" className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3Watts")}</label>
                <input type="number" min={0} {...register("pa_watts")} placeholder="4000" className="input" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3MaxDB")}</label>
                <input type="number" min={80} max={140} {...register("pa_max_db")} placeholder="108" className="input" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([
                { key: "has_frontfills", label: "Frontfills" },
                { key: "has_outfills", label: "Outfills" },
                { key: "has_subwoofers", label: "Subwoofers" },
              ] as const).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" {...register(key)} className="h-4 w-4 accent-accent" />
                  <span className="text-xs text-neutral-700">{label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3PANotes")}</label>
              <textarea rows={2} {...register("pa_notes")} placeholder={t("s3PANotesPh")} className="input" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-divider pt-6">
        <label className="mb-4 flex items-center gap-3">
          <input type="checkbox" {...register("has_foh_console")} className="h-4 w-4 accent-accent" />
          <span className="text-sm font-semibold">{t("s3HasFOH")}</span>
        </label>

        {hasFoh && (
          <div className="flex flex-col gap-4 pl-7">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3Brand")}</label>
                <input {...register("foh_console_brand")} placeholder="Yamaha" list="catalog-console-brand" className="input" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3Model")}</label>
                <input {...register("foh_console_model")} placeholder="CL5" list="catalog-console-model" className="input" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3ConsoleType")}</label>
                <select {...register("foh_console_type")} className="input">
                  <option value="">{t("s3ConsoleTypePh")}</option>
                  <option value="analog">{t("s3Analog")}</option>
                  <option value="digital">{t("s3Digital")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3InputCh")}</label>
                <input type="number" min={1} {...register("foh_console_channels")} placeholder="48" className="input" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3AuxOut")}</label>
                <input type="number" min={0} {...register("foh_console_outputs")} placeholder="16" className="input" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3FOHDistance")}</label>
              <input type="number" min={0} {...register("foh_max_distance_m")} placeholder="20" className="input" />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <datalist id="catalog-pa-brand">
        {PA_BRANDS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <datalist id="catalog-pa-model">
        {filteredPaModels.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <datalist id="catalog-console-brand">
        {FOH_CONSOLE_BRANDS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <datalist id="catalog-console-model">
        {filteredFohModels.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <VenueStepActions onBack={onBack} pending={isPending} />
    </form>
  );
}

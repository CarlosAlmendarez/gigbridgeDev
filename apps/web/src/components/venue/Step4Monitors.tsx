"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { MICS_ALL_UNIQUE, MONITOR_BRANDS, MONITOR_BRAND_MODELS, MONITOR_MODELS } from "@gigbridge/config";
import { VenueStepActions } from "@/components/venue/VenueStepActions";
import type { VenueRow } from "@gigbridge/types";

interface MicrophoneItem {
  model: string;
  quantity: number;
  type: "vocal" | "instrument" | "overhead" | "kick";
}

interface FormData {
  floor_monitors_count: number | "";
  floor_monitor_brand: string;
  floor_monitor_model: string;
  sidefills_count: number | "";
  has_in_ear_system: boolean;
  monitor_notes: string;
  microphones: MicrophoneItem[];
  mic_stands_boom: number | "";
  mic_stands_straight: number | "";
  mic_stands_short: number | "";
  di_boxes_count: number | "";
}

interface Props {
  venueId: string;
  initialData?: Partial<VenueRow>;
  onSaved: (venueId: string, data: Partial<VenueRow>) => void;
  onBack: () => void;
}

const MIC_TYPES = ["vocal", "instrument", "overhead", "kick"] as const;

export function Step4Monitors({ venueId, initialData, onSaved, onBack }: Props) {
  const t = useTranslations("venue_wizard");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch } = useForm<FormData>({
    defaultValues: {
      floor_monitors_count: initialData?.floor_monitors_count ?? "",
      floor_monitor_brand: initialData?.floor_monitor_brand ?? "",
      floor_monitor_model: initialData?.floor_monitor_model ?? "",
      sidefills_count: initialData?.sidefills_count ?? "",
      has_in_ear_system: initialData?.has_in_ear_system ?? false,
      monitor_notes: initialData?.monitor_notes ?? "",
      microphones: (initialData?.microphones as MicrophoneItem[]) ?? [],
      mic_stands_boom: initialData?.mic_stands_boom ?? "",
      mic_stands_straight: initialData?.mic_stands_straight ?? "",
      mic_stands_short: initialData?.mic_stands_short ?? "",
      di_boxes_count: initialData?.di_boxes_count ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "microphones" });
  const selectedMonitorBrand = watch("floor_monitor_brand");
  const filteredMonitorModels = (selectedMonitorBrand && MONITOR_BRAND_MODELS[selectedMonitorBrand]) || MONITOR_MODELS;

  function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const payload = {
        floor_monitors_count: data.floor_monitors_count !== "" ? Number(data.floor_monitors_count) : 0,
        floor_monitor_brand: data.floor_monitor_brand || null,
        floor_monitor_model: data.floor_monitor_model || null,
        sidefills_count: data.sidefills_count !== "" ? Number(data.sidefills_count) : 0,
        has_in_ear_system: data.has_in_ear_system,
        monitor_notes: data.monitor_notes || null,
        microphones: data.microphones,
        mic_stands_boom: data.mic_stands_boom !== "" ? Number(data.mic_stands_boom) : 0,
        mic_stands_straight: data.mic_stands_straight !== "" ? Number(data.mic_stands_straight) : 0,
        mic_stands_short: data.mic_stands_short !== "" ? Number(data.mic_stands_short) : 0,
        di_boxes_count: data.di_boxes_count !== "" ? Number(data.di_boxes_count) : 0,
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
        <p className="mb-3 text-sm font-bold">{t("s4MonitorTitle")}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s4Qty")}</label>
            <input type="number" min={0} {...register("floor_monitors_count")} placeholder="4" className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3Brand")}</label>
            <input {...register("floor_monitor_brand")} placeholder="d&b" list="catalog-monitor-brand" className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s3Model")}</label>
            <input {...register("floor_monitor_model")} placeholder="M2" list="catalog-monitor-model" className="input" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">Sidefills</label>
          <input type="number" min={0} {...register("sidefills_count")} placeholder="0" className="input" />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-3">
            <input type="checkbox" {...register("has_in_ear_system")} className="h-4 w-4 accent-accent" />
            <span className="text-sm text-neutral-700">{t("s4InEar")}</span>
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s4MonitorNotes")}</label>
        <textarea rows={2} {...register("monitor_notes")} placeholder={t("s4MonitorNotesPh")} className="input" />
      </div>

      <div className="border-t border-divider pt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold">{t("s4MicTitle")}</p>
          <button type="button" onClick={() => append({ model: "", quantity: 1, type: "vocal" })} className="btn btn-secondary py-1 text-xs">
            <Icon name="plus" size={13} />
            {t("s4AddMic")}
          </button>
        </div>

        {fields.length === 0 && <p className="py-4 text-center text-xs text-neutral-600">{t("s4NoMics")}</p>}

        <div className="flex flex-col gap-2">
          {fields.map((field, i) => (
            <div key={field.id} className="flex flex-col gap-2 rounded-md bg-surface p-2.5 sm:grid sm:grid-cols-12 sm:items-center">
              <div className="sm:col-span-5">
                <input {...register(`microphones.${i}.model`)} placeholder="Shure SM58" list="catalog-mics" className="input py-1.5 text-xs" />
              </div>
              <div className="flex gap-2 sm:contents">
                <div className="w-20 flex-shrink-0 sm:col-span-2">
                  <input type="number" min={1} {...register(`microphones.${i}.quantity`, { valueAsNumber: true })} placeholder="2" className="input py-1.5 text-xs" />
                </div>
                <div className="flex-1 sm:col-span-4">
                  <select {...register(`microphones.${i}.type`)} className="input py-1.5 text-xs">
                    {MIC_TYPES.map((mt) => (
                      <option key={mt} value={mt}>
                        {mt}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={() => remove(i)} className="flex flex-shrink-0 items-center justify-center text-red-500 sm:col-span-1">
                  <Icon name="x-circle" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-divider pt-6">
        <p className="mb-3 text-sm font-bold">{t("s4StandsTitle")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { key: "mic_stands_boom", labelKey: "s4BoomStands", label: undefined },
              { key: "mic_stands_straight", labelKey: "s4StraightStands", label: undefined },
              { key: "mic_stands_short", labelKey: undefined, label: "Miniboom" },
              { key: "di_boxes_count", labelKey: undefined, label: "DI Boxes" },
            ] as const
          ).map(({ key, labelKey, label }) => (
            <div key={key}>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
                {labelKey ? t(labelKey as Parameters<typeof t>[0]) : label}
              </label>
              <input type="number" min={0} {...register(key as keyof FormData)} placeholder="0" className="input" />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <datalist id="catalog-monitor-brand">
        {MONITOR_BRANDS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <datalist id="catalog-monitor-model">
        {filteredMonitorModels.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <datalist id="catalog-mics">
        {MICS_ALL_UNIQUE.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <VenueStepActions onBack={onBack} pending={isPending} />
    </form>
  );
}

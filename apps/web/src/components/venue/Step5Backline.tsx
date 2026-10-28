"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { BACKLINE_ALL } from "@gigbridge/config";
import { VenueStepActions } from "@/components/venue/VenueStepActions";
import type { VenueRow } from "@gigbridge/types";

type BacklineCategory = "drums" | "guitar_amp" | "bass_amp" | "keyboard" | "percussion" | "other";

interface BacklineItem {
  category: BacklineCategory;
  item: string;
  available: boolean;
  notes: string;
}

interface FormData {
  has_backline_loan: boolean;
  backline: BacklineItem[];
}

interface Props {
  venueId: string;
  initialData?: Partial<VenueRow>;
  onSaved: (venueId: string, data: Partial<VenueRow>) => void;
  onBack: () => void;
}

const CATEGORIES: { value: BacklineCategory; labelKey: string }[] = [
  { value: "drums", labelKey: "s5CatDrums" },
  { value: "guitar_amp", labelKey: "s5CatGuitarAmp" },
  { value: "bass_amp", labelKey: "s5CatBassAmp" },
  { value: "keyboard", labelKey: "s5CatKeyboard" },
  { value: "percussion", labelKey: "s5CatPercussion" },
  { value: "other", labelKey: "s5CatOther" },
];

const SUGGESTIONS: Array<{ category: BacklineCategory; item: string }> = [
  { category: "drums", item: "Batería acústica completa" },
  { category: "guitar_amp", item: "Fender Twin Reverb" },
  { category: "guitar_amp", item: "Marshall JVM 100W" },
  { category: "bass_amp", item: "Ampeg SVT-CL" },
  { category: "bass_amp", item: "Fender Rumble 500" },
  { category: "keyboard", item: "Yamaha P-525 88 teclas" },
];

export function Step5Backline({ venueId, initialData, onSaved, onBack }: Props) {
  const t = useTranslations("venue_wizard");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch } = useForm<FormData>({
    defaultValues: {
      has_backline_loan: initialData?.has_backline_loan ?? false,
      backline: (initialData?.backline as BacklineItem[]) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "backline" });
  const hasBackline = watch("has_backline_loan");

  function addSuggestion(s: { category: BacklineCategory; item: string }) {
    append({ category: s.category, item: s.item, available: true, notes: "" });
  }

  function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const payload = { has_backline_loan: data.has_backline_loan, backline: data.backline };
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
      <label className="flex items-center gap-3">
        <input type="checkbox" {...register("has_backline_loan")} className="h-4 w-4 accent-accent" />
        <span className="text-sm font-semibold">{t("s5HasBackline")}</span>
      </label>

      {hasBackline && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600">{t("s5QuickAdd")}</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s.item} type="button" onClick={() => addSuggestion(s)} className="rounded-md border border-divider px-3 py-1 text-xs text-neutral-700">
                  + {s.item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t("s5InventoryTitle")}</p>
            <button type="button" onClick={() => append({ category: "other", item: "", available: true, notes: "" })} className="btn btn-secondary py-1 text-xs">
              <Icon name="plus" size={13} />
              {t("s5AddItem")}
            </button>
          </div>

          {fields.length === 0 && <p className="py-3 text-center text-xs text-neutral-600">{t("s5NoItems")}</p>}

          <div className="flex flex-col gap-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex flex-col items-start gap-2 rounded-md bg-surface p-2.5 sm:grid sm:grid-cols-12 sm:items-center">
                <div className="w-full sm:col-span-3">
                  <select {...register(`backline.${i}.category`)} className="input py-1.5 text-xs">
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {t(c.labelKey as Parameters<typeof t>[0])}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:col-span-5">
                  <input {...register(`backline.${i}.item`)} placeholder="Ludwig Classic Maple 22''" list="catalog-backline" className="input py-1.5 text-xs" />
                </div>
                <div className="flex w-full items-center gap-2 sm:col-span-2">
                  <input type="checkbox" {...register(`backline.${i}.available`)} className="h-4 w-4 accent-accent" />
                  <span className="text-xs text-neutral-600">{t("s5Available")}</span>
                </div>
                <div className="w-full sm:col-span-1 sm:w-auto">
                  <button type="button" onClick={() => remove(i)} className="flex w-full justify-center text-red-500">
                    <Icon name="x-circle" size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <datalist id="catalog-backline">
        {BACKLINE_ALL.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      <VenueStepActions onBack={onBack} pending={isPending} />
    </form>
  );
}

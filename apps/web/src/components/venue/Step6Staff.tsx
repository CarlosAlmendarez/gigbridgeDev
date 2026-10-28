"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { VenueStepActions } from "@/components/venue/VenueStepActions";
import type { VenueRow } from "@gigbridge/types";

const GENRES = [
  "Rock", "Metal", "Indie", "Pop", "Jazz", "Blues", "Cumbia", "Salsa", "Norteño",
  "Electrónica", "Hip-Hop", "Reggae", "Folclórico", "Clásica", "Otro",
];

interface FormData {
  has_audio_engineer: boolean;
  has_stage_manager: boolean;
  has_lighting_engineer: boolean;
  has_lighting: boolean;
  lighting_notes: string;
  price_per_event_min: number | "";
  price_per_event_max: number | "";
  is_discoverable: boolean;
}

interface Props {
  venueId: string;
  initialData?: Partial<VenueRow>;
  onSaved: (venueId: string, data: Partial<VenueRow>) => void;
  onBack: () => void;
}

export function Step6Staff({ venueId, initialData, onSaved, onBack }: Props) {
  const t = useTranslations("venue_wizard");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialData?.genres_hosted ?? []);

  const { register, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      has_audio_engineer: initialData?.has_audio_engineer ?? false,
      has_stage_manager: initialData?.has_stage_manager ?? false,
      has_lighting_engineer: initialData?.has_lighting_engineer ?? false,
      has_lighting: initialData?.has_lighting ?? false,
      lighting_notes: initialData?.lighting_notes ?? "",
      price_per_event_min: initialData?.price_per_event_min ?? "",
      price_per_event_max: initialData?.price_per_event_max ?? "",
      is_discoverable: initialData?.is_discoverable ?? true,
    },
  });

  const hasLighting = watch("has_lighting");

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
  }

  function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const payload = {
        has_audio_engineer: data.has_audio_engineer,
        has_stage_manager: data.has_stage_manager,
        has_lighting_engineer: data.has_lighting_engineer,
        has_lighting: data.has_lighting,
        lighting_notes: data.lighting_notes || null,
        genres_hosted: selectedGenres,
        price_per_event_min: data.price_per_event_min !== "" ? Number(data.price_per_event_min) : null,
        price_per_event_max: data.price_per_event_max !== "" ? Number(data.price_per_event_max) : null,
        is_discoverable: data.is_discoverable,
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
        <p className="mb-3 text-sm font-bold">{t("s6StaffTitle")}</p>
        <div className="flex flex-col gap-3">
          {([
            { key: "has_audio_engineer", labelKey: "s6AudioEngineer" },
            { key: "has_stage_manager", labelKey: "s6StageManager" },
            { key: "has_lighting_engineer", labelKey: "s6LightingEngineer" },
          ] as const).map(({ key, labelKey }) => (
            <label key={key} className="flex items-center gap-3">
              <input type="checkbox" {...register(key)} className="h-4 w-4 accent-accent" />
              <span className="text-sm text-neutral-700">{t(labelKey)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-divider pt-6">
        <label className="mb-3 flex items-center gap-3">
          <input type="checkbox" {...register("has_lighting")} className="h-4 w-4 accent-accent" />
          <span className="text-sm font-semibold">{t("s6HasLighting")}</span>
        </label>
        {hasLighting && (
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s6LightingNotes")}</label>
            <textarea rows={2} {...register("lighting_notes")} placeholder="DMX, moving heads, gobos, pantallas LED..." className="input" />
          </div>
        )}
      </div>

      <div className="border-t border-divider pt-6">
        <p className="mb-3 text-sm font-bold">{t("s6GenresTitle")}</p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => {
            const active = selectedGenres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={["rounded-full border px-3 py-1.5 text-xs font-semibold", active ? "border-accent bg-accent-100 text-accent-800" : "border-divider text-neutral-600"].join(" ")}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-divider pt-6">
        <p className="mb-3 text-sm font-bold">{t("s6PriceTitle")}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s6PriceMin")}</label>
            <input type="number" min={0} {...register("price_per_event_min")} placeholder="5000" className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("s6PriceMax")}</label>
            <input type="number" min={0} {...register("price_per_event_max")} placeholder="25000" className="input" />
          </div>
        </div>
      </div>

      <div className="border-t border-divider pt-6">
        <label className="flex items-center gap-3">
          <input type="checkbox" {...register("is_discoverable")} className="h-4 w-4 accent-accent" />
          <div>
            <span className="text-sm font-semibold">{t("s6Discoverable")}</span>
            <p className="mt-0.5 text-xs text-neutral-600">{t("s6DiscoverableDesc")}</p>
          </div>
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <VenueStepActions onBack={onBack} pending={isPending} finish />
    </form>
  );
}

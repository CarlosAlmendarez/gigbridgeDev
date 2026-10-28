"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { AvailabilityScheduleEditor } from "@/components/venue/AvailabilityScheduleEditor";
import { VenueStepActions } from "@/components/venue/VenueStepActions";
import type { VenueRow } from "@gigbridge/types";

interface FormData {
  cancellation_policy: string;
  load_in_time_limit_minutes: number | "";
  curfew_time: string;
}

interface Props {
  venueId: string;
  initialData?: Partial<VenueRow>;
  onSaved: (venueId: string, data: Partial<VenueRow>) => void;
  onBack: () => void;
}

export function StepBookingRules({ venueId, initialData, onSaved, onBack }: Props) {
  const t = useTranslations("venue_wizard");
  const [isPending, startTransition] = useTransition();
  const POLICY_SUGGESTIONS = [t("sBookPolicyFlex"), t("sBookPolicyMod"), t("sBookPolicyStrict")];
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      cancellation_policy: initialData?.cancellation_policy ?? "",
      load_in_time_limit_minutes: initialData?.load_in_time_limit_minutes ?? "",
      curfew_time: initialData?.curfew_time ?? "",
    },
  });

  const policyValue = watch("cancellation_policy");

  function onSubmit(data: FormData) {
    setError(null);
    startTransition(async () => {
      const payload = {
        cancellation_policy: data.cancellation_policy || null,
        load_in_time_limit_minutes: data.load_in_time_limit_minutes !== "" ? Number(data.load_in_time_limit_minutes) : null,
        curfew_time: data.curfew_time || null,
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
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("sBookPolicy")}</label>
        <textarea rows={3} {...register("cancellation_policy")} placeholder={t("sBookPolicyPh")} className="input" />
        <button type="button" onClick={() => setShowSuggestions((v) => !v)} className="mt-1.5 text-xs text-accent-800">
          {showSuggestions ? t("sBookHideSuggestions") : t("sBookShowSuggestions")}
        </button>
        {showSuggestions && (
          <div className="mt-2 flex flex-col gap-2">
            {POLICY_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setValue("cancellation_policy", s);
                  setShowSuggestions(false);
                }}
                className={["rounded-md border p-3 text-left text-xs", policyValue === s ? "border-accent bg-accent-100" : "border-divider"].join(" ")}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("sBookLoadIn")}</label>
          <input type="number" min={0} {...register("load_in_time_limit_minutes")} placeholder="120" className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("sBookCurfew")}</label>
          <input type="time" {...register("curfew_time")} className="input" />
        </div>
      </div>

      <div className="border-t border-divider pt-5">
        <p className="mb-1 text-sm font-bold">{t("sBookAvailTitle")}</p>
        <p className="mb-4 text-xs text-neutral-600">{t("sBookAvailDesc")}</p>
        <AvailabilityScheduleEditor venueId={venueId} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <VenueStepActions onBack={onBack} pending={isPending} />
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { Step0VenueType } from "@/components/venue/Step0VenueType";
import { Step1Identity } from "@/components/venue/Step1Identity";
import { Step2Stage } from "@/components/venue/Step2Stage";
import { Step3PA } from "@/components/venue/Step3PA";
import { Step4Monitors } from "@/components/venue/Step4Monitors";
import { Step5Backline } from "@/components/venue/Step5Backline";
import { Step6Staff } from "@/components/venue/Step6Staff";
import { StepBookingRules } from "@/components/venue/StepBookingRules";
import { StepAccessibility } from "@/components/venue/StepAccessibility";
import { StepMultimedia } from "@/components/venue/StepMultimedia";
import type { VenueRow } from "@gigbridge/types";

type StepKey = "type" | "identity" | "stage" | "pa" | "monitors" | "backline" | "staff" | "booking" | "accessibility" | "multimedia";

const STEP_DEFS: Record<StepKey, { labelKey: string; icon: string }> = {
  type: { labelKey: "stepType", icon: "stack" },
  identity: { labelKey: "stepIdentity", icon: "buildings" },
  stage: { labelKey: "stepStage", icon: "speaker-high" },
  pa: { labelKey: "stepPA", icon: "speaker-high" },
  monitors: { labelKey: "stepMonitors", icon: "headphones" },
  backline: { labelKey: "stepBackline", icon: "guitar" },
  staff: { labelKey: "stepStaff", icon: "users-three" },
  booking: { labelKey: "stepBooking", icon: "calendar-dot" },
  accessibility: { labelKey: "stepAccessibility", icon: "wifi-high" },
  multimedia: { labelKey: "stepMultimedia", icon: "image-square" },
};

/**
 * A diferencia de v1, siempre son los mismos steps sin importar
 * venue_type — rehearsal_studio/hybrid están deshabilitados en
 * Step0VenueType (ver esa nota) hasta que se porten sus steps
 * específicos (StepRehearsalDetails, StepRooms).
 */
const ACTIVE_STEPS: StepKey[] = ["type", "identity", "stage", "pa", "monitors", "backline", "staff", "booking", "accessibility", "multimedia"];

interface Props {
  profileId: string;
  initialVenueId?: string;
  initialData?: Partial<VenueRow>;
}

export function VenueSetupWizard({ profileId, initialVenueId, initialData }: Props) {
  const t = useTranslations("venue_wizard");
  const isResuming = !!initialVenueId;
  const [currentStep, setCurrentStep] = useState(0);
  const [venueId, setVenueId] = useState<string | null>(initialVenueId ?? null);
  const [venueData, setVenueData] = useState<Partial<VenueRow>>(initialData ?? {});
  const [completed, setCompleted] = useState(false);

  const effectiveStep = Math.min(currentStep, ACTIVE_STEPS.length - 1);
  const currentStepKey = ACTIVE_STEPS[effectiveStep];

  function handleSaved(id: string, data: Partial<VenueRow>) {
    if (id) setVenueId(id);
    setVenueData((prev) => ({ ...prev, ...data }));
    if (effectiveStep < ACTIVE_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      fetch("/api/venues/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: id || venueId, is_discoverable: true }),
      }).catch(() => {});
      setCompleted(true);
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  if (completed && (venueId || venueData.id)) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-accent-border bg-accent-100">
          <Icon name="check-circle" size={36} className="text-accent-800" />
        </div>
        <div>
          <h2 className="mb-2 font-heading text-2xl font-semibold">{t("wizDoneTitle")}</h2>
          <p className="text-sm text-neutral-700">{t("wizDoneBody")}</p>
        </div>

        <div className="flex w-full max-w-sm gap-3">
          <Link href={`/venue/${venueData.slug}`} className="btn btn-secondary flex-1">
            {t("wizViewProfile")}
          </Link>
          <Link href="/dashboard/venue" className="btn btn-primary flex-1">
            {t("wizGoDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  const currentDef = STEP_DEFS[currentStepKey];

  return (
    <div className="flex flex-col gap-6">
      {isResuming && (
        <div className="rounded-md border border-accent-border bg-accent-100 px-4 py-2.5">
          <span className="text-xs text-accent-800">{t("wizResume", { name: venueData.name ?? "tu venue" })}</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-neutral-600">{t("wizProgress", { step: effectiveStep + 1, total: ACTIVE_STEPS.length })}</p>
          <p className="flex items-center gap-1.5 text-xs font-bold text-accent-800">
            <Icon name={currentDef.icon} size={13} />
            {t(currentDef.labelKey as Parameters<typeof t>[0])}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${((effectiveStep + 1) / ACTIVE_STEPS.length) * 100}%` }} />
        </div>
        <div className="flex gap-1.5">
          {ACTIVE_STEPS.map((key, i) => (
            <button
              key={key}
              type="button"
              disabled={!isResuming && i > effectiveStep}
              onClick={() => {
                if (isResuming || i <= effectiveStep) setCurrentStep(i);
              }}
              className={["h-1 flex-1 rounded-full transition-all", i < effectiveStep ? "bg-accent-500" : i === effectiveStep ? "bg-accent" : "bg-surface"].join(" ")}
            />
          ))}
        </div>
      </div>

      <div>
        {currentStepKey === "type" && <Step0VenueType venueId={venueId} initialData={venueData} onSaved={handleSaved} />}
        {currentStepKey === "identity" && <Step1Identity profileId={profileId} venueId={venueId} initialData={venueData} onSaved={handleSaved} />}
        {currentStepKey === "stage" && venueId && <Step2Stage venueId={venueId} initialData={venueData} onSaved={handleSaved} onBack={handleBack} />}
        {currentStepKey === "pa" && venueId && <Step3PA venueId={venueId} initialData={venueData} onSaved={handleSaved} onBack={handleBack} />}
        {currentStepKey === "monitors" && venueId && <Step4Monitors venueId={venueId} initialData={venueData} onSaved={handleSaved} onBack={handleBack} />}
        {currentStepKey === "backline" && venueId && <Step5Backline venueId={venueId} initialData={venueData} onSaved={handleSaved} onBack={handleBack} />}
        {currentStepKey === "staff" && venueId && <Step6Staff venueId={venueId} initialData={venueData} onSaved={handleSaved} onBack={handleBack} />}
        {currentStepKey === "booking" && venueId && <StepBookingRules venueId={venueId} initialData={venueData} onSaved={handleSaved} onBack={handleBack} />}
        {currentStepKey === "accessibility" && venueId && <StepAccessibility venueId={venueId} initialData={venueData} onSaved={handleSaved} onBack={handleBack} />}
        {currentStepKey === "multimedia" && venueId && <StepMultimedia venueId={venueId} initialData={venueData} onSaved={handleSaved} onBack={handleBack} />}
      </div>
    </div>
  );
}

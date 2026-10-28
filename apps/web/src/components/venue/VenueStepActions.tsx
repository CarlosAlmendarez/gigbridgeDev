"use client";

import { useTranslations } from "next-intl";

interface Props {
  onBack?: () => void;
  pending: boolean;
  finish?: boolean;
  disabled?: boolean;
}

/** Par de botones back/save repetido en cada step del wizard de venue. */
export function VenueStepActions({ onBack, pending, finish, disabled }: Props) {
  const t = useTranslations("venue_wizard");
  return (
    <div className="flex gap-3">
      {onBack && (
        <button type="button" onClick={onBack} className="btn btn-secondary flex-1">
          {t("wizBack")}
        </button>
      )}
      <button type="submit" disabled={pending || disabled} className="btn btn-primary flex-[2]">
        {pending ? t("wizSaving") : finish ? t("wizFinish") : t("wizSave")}
      </button>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";

interface Props {
  is_verified: boolean;
  size?: "sm" | "md";
}

export function VerifiedBadge({ is_verified, size = "md" }: Props) {
  const t = useTranslations("venue");
  if (!is_verified) return null;

  if (size === "sm") {
    return (
      <span title={t("verified_venueTooltip")} className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-accent-border bg-accent-100">
        <Icon name="shield-check" size={12} className="text-accent-800" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-100 px-2.5 py-1 text-[11px] font-bold text-accent-800">
      <Icon name="shield-check" size={13} />
      {t("verified_venueLabel")}
    </span>
  );
}

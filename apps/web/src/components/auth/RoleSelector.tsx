"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import type { UserRole } from "@gigbridge/types";

interface RoleOption {
  value: UserRole;
  icon: string;
  labelKey: string;
  disabled: boolean;
}

const ROLES: RoleOption[] = [
  { value: "artist", icon: "music-notes", labelKey: "role_artist_label", disabled: false },
  { value: "venue", icon: "buildings", labelKey: "role_venue_label", disabled: false },
  { value: "fan", icon: "heart", labelKey: "role_fan_label", disabled: false },
  { value: "booker", icon: "briefcase", labelKey: "role_booker_label", disabled: true },
  { value: "manager", icon: "star", labelKey: "role_manager_label", disabled: true },
];

interface Props {
  name?: string;
  value: UserRole | null;
  onChange: (role: UserRole) => void;
}

export function RoleSelector({ name = "role", value, onChange }: Props) {
  const t = useTranslations("auth");

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name={name} value={value ?? ""} />
      {ROLES.map((role) => {
        const isSelected = value === role.value;
        return (
          <button
            key={role.value}
            type="button"
            disabled={role.disabled}
            onClick={() => onChange(role.value)}
            className={[
              "flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors",
              isSelected ? "border-accent bg-accent-100" : "border-divider bg-transparent",
              role.disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
            ].join(" ")}
          >
            <Icon name={role.icon} size={16} className={isSelected ? "text-accent-800" : "text-neutral-600"} />
            <span className={["flex-1 text-[13px] font-medium", isSelected ? "text-accent-800" : "text-text"].join(" ")}>
              {t(role.labelKey)}
            </span>
            {role.disabled && (
              <span className="flex-shrink-0 rounded-full border border-divider bg-surface px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-neutral-600">
                {t("comingSoon")}
              </span>
            )}
            <div
              className={[
                "h-3.5 w-3.5 flex-shrink-0 rounded-full",
                isSelected ? "border-4 border-accent" : "border border-divider",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}

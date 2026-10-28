"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { checkSlugAvailability } from "@/lib/actions/auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface SlugFieldProps {
  value: string;
  onChange: (value: string) => void;
  onAvailabilityChange?: (available: boolean) => void;
}

export function SlugField({ value, onChange, onAvailabilityChange }: SlugFieldProps) {
  const [checking, startCheck] = useTransition();
  const [available, setAvailable] = useState<boolean | null>(null);
  const t = useTranslations("auth");
  const normalized = slugify(value);

  useEffect(() => {
    if (!normalized || normalized.length < 2) {
      const timer = setTimeout(() => setAvailable(null), 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      startCheck(async () => {
        const ok = await checkSlugAvailability(normalized);
        setAvailable(ok);
        onAvailabilityChange?.(ok);
      });
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized]);

  const borderClass =
    available === false ? "border-red-400" : available === true ? "border-green-500" : "border-divider";

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
        {t("yourGigBridgeUrl")}
      </label>
      <div className={["input flex items-center overflow-hidden p-0", borderClass].join(" ")}>
        <span className="flex-shrink-0 select-none whitespace-nowrap pl-3 pr-1 text-sm text-neutral-500">
          gigbridge.app/
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="tu-nombre"
          className="flex-1 bg-transparent py-2 pr-2 text-sm outline-none"
          required
          minLength={2}
          maxLength={50}
          pattern="[a-zA-Z0-9\s-]+"
        />
        <span className="flex-shrink-0 pr-3">
          {checking && <Icon name="circle-notch" size={15} className="animate-spin text-neutral-500" />}
          {!checking && available === true && <Icon name="check-circle" size={15} className="text-green-600" />}
          {!checking && available === false && <Icon name="x-circle" size={15} className="text-red-500" />}
        </span>
      </div>

      {normalized && (
        <p className={["text-xs", available === false ? "text-red-500" : available === true ? "text-green-600" : "text-neutral-600"].join(" ")}>
          {available === null && `gigbridge.app/${normalized}`}
          {available === true && t("slugAvailableMsg", { slug: normalized })}
          {available === false && t("slugTakenMsg", { slug: normalized })}
        </p>
      )}

      <input type="hidden" name="slug" value={normalized} />
    </div>
  );
}

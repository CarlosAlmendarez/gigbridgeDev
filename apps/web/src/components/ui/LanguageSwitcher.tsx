"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Icon } from "@/components/Icon";
import { setLocale } from "@/lib/actions/locale";
import type { Locale } from "@gigbridge/config";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next: Locale = locale === "es" ? "en" : "es";
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
      className="inline-flex items-center gap-1.5 rounded-md border border-divider bg-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700 disabled:opacity-50"
    >
      <Icon name="globe" size={13} />
      {locale === "es" ? "ES" : "EN"}
    </button>
  );
}

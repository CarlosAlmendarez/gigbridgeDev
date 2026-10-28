"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { register } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { SlugField } from "@/components/auth/SlugField";
import type { UserRole } from "@gigbridge/types";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [slugValue, setSlugValue] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const t = useTranslations("auth");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (slugAvailable === false) {
      setError(t("slugUnavailable"));
      return;
    }
    if (!selectedRole) {
      setError(t("selectRole"));
      return;
    }
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await register(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AuthShell>
      <div className="mb-5">
        <h2 className="font-heading text-xl font-semibold">{t("createYourAccount")}</h2>
        <p className="text-sm text-neutral-700">{t("registerSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("artisticName")}</label>
          <input name="display_name" type="text" placeholder="La Banda Perfecta" required className="input" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("iAm")}</label>
          <RoleSelector value={selectedRole} onChange={setSelectedRole} />
        </div>

        <SlugField value={slugValue} onChange={setSlugValue} onAvailabilityChange={setSlugAvailable} />

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("emailAddress")}</label>
          <input name="email" type="email" autoComplete="email" placeholder="tu@correo.com" required className="input" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("password")}</label>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
            className="input"
          />
        </div>

        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <button type="submit" disabled={isPending || slugAvailable === false || !selectedRole} className="btn btn-primary btn-block">
          {isPending ? t("creatingAccount") : t("createAccountBtn")}
        </button>

        <p className="mt-1 text-[13px] leading-relaxed text-neutral-700">
          <strong>{t("includesFrom")}</strong> {t("registerTip")} <span className="text-accent-800">{t("allFree")}</span>{" "}
          {t("whileInBeta")}
        </p>
      </form>
    </AuthShell>
  );
}

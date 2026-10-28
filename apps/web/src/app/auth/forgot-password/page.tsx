"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { forgotPassword } from "@/lib/actions/auth";
import { AuthStandaloneCard } from "@/components/auth/AuthStandaloneCard";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { Icon } from "@/components/Icon";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("auth");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await forgotPassword(formData);
      if (result.error) setError(result.error);
      if (result.success) setSuccess(result.success);
    });
  }

  return (
    <AuthStandaloneCard
      subtitle={t("recoverPassword")}
      footer={
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-neutral-600">
          <Icon name="arrow-left" size={13} />
          {t("backToLogin")}
        </Link>
      }
    >
      {success ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-green-300 bg-green-50">
            <Icon name="check-circle" size={26} className="text-green-600" />
          </div>
          <p className="text-center text-sm leading-relaxed text-neutral-700">{success}</p>
          <Link href="/auth/login" className="text-sm font-semibold text-accent-800">
            {t("backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <p className="text-sm leading-relaxed text-neutral-700">{t("forgotInstructions")}</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("emailAddress")}</label>
            <input name="email" type="email" autoComplete="email" placeholder="tu@correo.com" required className="input" />
          </div>

          {error && <AuthAlert variant="error">{error}</AuthAlert>}

          <button type="submit" disabled={isPending} className="btn btn-primary btn-block">
            {isPending ? t("sending") : t("sendLink")}
          </button>
        </form>
      )}
    </AuthStandaloneCard>
  );
}

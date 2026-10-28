"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { resetPassword } from "@/lib/actions/auth";
import { AuthStandaloneCard } from "@/components/auth/AuthStandaloneCard";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { Icon } from "@/components/Icon";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("auth");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    if (password !== confirmPassword) {
      setError(t("passwordsDontMatch"));
      return;
    }

    startTransition(async () => {
      const result = await resetPassword(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AuthStandaloneCard
      subtitle={t("resetPasswordTitle")}
      footer={
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-neutral-600">
          <Icon name="arrow-left" size={13} />
          {t("backToLogin")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <p className="text-sm leading-relaxed text-neutral-700">{t("resetPasswordInstructions")}</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("newPassword")}</label>
          <input name="password" type="password" autoComplete="new-password" required minLength={6} className="input" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("confirmNewPassword")}</label>
          <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={6} className="input" />
        </div>

        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <button type="submit" disabled={isPending} className="btn btn-primary btn-block">
          {isPending ? t("saving") : t("savePassword")}
        </button>
      </form>
    </AuthStandaloneCard>
  );
}

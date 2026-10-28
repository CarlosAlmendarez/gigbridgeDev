"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { login, resendConfirmationEmail } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthAlert } from "@/components/auth/AuthAlert";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResendTransition] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("auth");

  const isEmailNotConfirmed = error?.toLowerCase().includes("email not confirmed");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResendMsg(null);
    const formData = new FormData(e.currentTarget);
    // El proxy manda aquí con ?next=<página pedida>; se vuelve a ella al entrar.
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) formData.set("next", next);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  }

  function handleResend() {
    const email = emailRef.current?.value;
    if (!email) return;
    setResendMsg(null);
    startResendTransition(async () => {
      const result = await resendConfirmationEmail(email);
      if (result.error) setError(result.error);
      else setResendMsg(result.success ?? null);
    });
  }

  return (
    <AuthShell>
      <div className="mb-5">
        <h2 className="font-heading text-xl font-semibold">{t("welcomeBack")}</h2>
        <p className="text-sm text-neutral-700">{t("loginSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("email")}</label>
          <input
            ref={emailRef}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@banda.mx"
            required
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("password")}</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="input"
          />
        </div>

        <div className="flex items-center justify-between text-[13px]">
          <label className="flex items-center gap-1.5 text-neutral-700">
            <input type="checkbox" name="remember" className="accent-accent" />
            {t("rememberMe")}
          </label>
          <Link href="/auth/forgot-password" className="text-accent-800">
            {t("forgotPassword")}
          </Link>
        </div>

        {error && (
          <AuthAlert variant="error">
            {error}
            {isEmailNotConfirmed && (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="btn btn-secondary mt-2 min-h-0 py-1 text-xs disabled:opacity-60"
              >
                {isResending ? t("resending") : t("resend")}
              </button>
            )}
          </AuthAlert>
        )}

        {resendMsg && <AuthAlert variant="success">{resendMsg}</AuthAlert>}

        <button type="submit" disabled={isPending} className="btn btn-primary btn-block">
          {isPending ? t("signingIn") : t("signIn")}
        </button>

        <p className="mt-1 text-[13px] leading-relaxed text-neutral-700">
          <strong>{t("firstTime")}</strong> {t("betaDescription")} <span className="text-accent-800">{t("allFree")}</span>{" "}
          {t("whileInBeta")}{" "}
          <Link href="/auth/register" className="font-semibold text-accent-800">
            {t("createAccountLink")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

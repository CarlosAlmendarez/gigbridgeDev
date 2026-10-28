"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { resendConfirmationEmail } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { Icon } from "@/components/Icon";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const t = useTranslations("auth");

  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isResending, startResendTransition] = useTransition();

  function handleResend() {
    if (!email) return;
    setResendMsg(null);
    setResendError(null);
    startResendTransition(async () => {
      const result = await resendConfirmationEmail(email);
      if (result.error) setResendError(result.error);
      else setResendMsg(result.success ?? null);
    });
  }

  return (
    <>
      <div className="mb-6 pt-2 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-accent-border bg-accent-100">
          <Icon name="envelope-open" size={24} className="text-accent-800" />
        </div>
        <h2 className="mb-2 font-heading text-xl font-semibold">{t("checkYourEmail")}</h2>
        <p className="text-sm leading-relaxed text-neutral-700">
          {t("activationSentPre")} {email && <strong className="text-text">{email}</strong>}
          {t("activationSentPost")}
        </p>
      </div>

      <div className="card mb-5 text-[13px] leading-relaxed text-neutral-700">
        <strong className="text-text">{t("noEmailArrived")}</strong> {t("spamInstructions")}
      </div>

      {resendError && <AuthAlert variant="error">{resendError}</AuthAlert>}
      {resendMsg && <AuthAlert variant="success">{resendMsg}</AuthAlert>}

      <button onClick={handleResend} disabled={isResending || !email} className="btn btn-primary btn-block">
        {isResending ? t("resending") : t("resend")}
      </button>

      <div className="mt-4 text-center text-[13px]">
        <Link href="/auth/login" className="text-accent-800">
          {t("backToLoginLink")}
        </Link>
      </div>
    </>
  );
}

export default function CheckEmailPage() {
  const t = useTranslations("auth");
  return (
    <AuthShell>
      <Suspense fallback={<div className="text-sm text-neutral-600">{t("loading")}</div>}>
        <CheckEmailContent />
      </Suspense>
    </AuthShell>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface Props {
  children: React.ReactNode;
}

export function AuthShell({ children }: Props) {
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/auth/login");
  const t = useTranslations("auth");

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* ── Lado de marca ────────────────────────────── */}
      <div className="hidden flex-col justify-between gap-8 bg-surface p-10 md:flex">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 font-heading text-lg font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-bg">G</span>
            GigBridge
          </Link>
          <div className="mt-8 font-heading text-[32px] font-semibold leading-tight tracking-[-0.02em]">
            {t.rich("tagline", { br: () => <br />, em: (chunks) => <em>{chunks}</em> })}
          </div>
        </div>

        <blockquote className="border-l-2 border-accent pl-4 text-[15px] italic text-neutral-700">
          &ldquo;{t("quote")}&rdquo;
          <cite className="mt-2 block text-xs not-italic uppercase tracking-[0.08em] text-neutral-600">
            {t("quoteAuthor")}
          </cite>
        </blockquote>

        <div className="flex gap-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-neutral-600">{t("statArtists")}</div>
            <div className="font-heading text-xl font-semibold">1,284</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-neutral-600">{t("statRiders")}</div>
            <div className="font-heading text-xl font-semibold">3,420</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-neutral-600">{t("statVenues")}</div>
            <div className="font-heading text-xl font-semibold">68</div>
          </div>
        </div>
      </div>

      {/* ── Lado de formulario ───────────────────────── */}
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex items-center gap-1 border-b border-divider">
          <Link
            href="/auth/login"
            className={["px-3 py-2 text-sm font-heading font-semibold", isLogin ? "border-b-2 border-accent text-accent-800" : "text-neutral-600"].join(" ")}
          >
            {t("login")}
          </Link>
          <Link
            href="/auth/register"
            className={["px-3 py-2 text-sm font-heading font-semibold", !isLogin ? "border-b-2 border-accent text-accent-800" : "text-neutral-600"].join(" ")}
          >
            {t("createAccount")}
          </Link>
          <div className="ml-auto pb-2">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

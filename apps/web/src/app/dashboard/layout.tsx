import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { clientMessages } from "@/lib/clientMessages";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { logout } from "@/lib/actions/auth";

/**
 * Shell mínimo — no el `DashboardNav` completo de v1 (sidebar/bottom-bar
 * con secciones de perfil, rider, booking, availability, events,
 * analytics...): ninguna de esas páginas existe todavía en este
 * monorepo. Se amplía cuando se porten.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [t, messages] = await Promise.all([
    getTranslations("nav"),
    clientMessages(["auth", "dashboard", "venue", "venue_wizard"]),
  ]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-divider px-4 py-3">
        <Link href="/dashboard" className="font-heading text-lg font-semibold">
          GigBridge
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <form action={logout}>
            <button type="submit" className="text-xs text-neutral-600">
              {t("signOut")}
            </button>
          </form>
        </div>
      </header>
      <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
    </div>
  );
}

import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { clientMessages } from "@/lib/clientMessages";
import { getTourInvite } from "@gigbridge/data";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { rememberInviteAction } from "@/lib/actions/invite";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { AcceptInvite } from "./AcceptInvite";

/**
 * Enlace de invitación a una gira. Se ve sin sesión (la vista previa sale
 * de get_tour_invite, 0017); aceptar exige sesión y perfil. Sin sesión, el
 * token se guarda en una cookie antes de ir a login/registro (ver
 * lib/actions/invite.ts).
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [supabase, t, te, messages] = await Promise.all([
    getSupabaseServerClient(),
    getTranslations("tour.invite"),
    getTranslations("tour.errors"),
    clientMessages(["tour"]),
  ]);
  // AcceptInvite solo usa tour.invite.
  const inviteMessages = { tour: { invite: (messages.tour as { invite: unknown }).invite } };
  const [invite, { data: auth }] = await Promise.all([getTourInvite(supabase, token), supabase.auth.getUser()]);
  const { data: profile } = auth.user
    ? await supabase.from("profiles").select("id").eq("user_id", auth.user.id).maybeSingle()
    : { data: null };

  const vars = { by: invite.invitedBy ?? "", tour: invite.tourName ?? "", person: invite.personName ?? "" };
  const stateMessage =
    invite.state === "expired" ? te("invite_expired") : invite.state === "accepted" ? te("invite_used") : te("invite_not_found");

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-divider px-4 py-3">
        <Link href="/" className="font-heading text-lg font-semibold">
          GigBridge
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
        <h1 className="font-heading text-3xl font-semibold">{t("title")}</h1>
        {invite.state !== "valid" ? (
          <>
            <p className="text-base">{stateMessage}</p>
            <Link href="/dashboard" className="btn btn-secondary min-h-11 self-start">
              {t("goHome")}
            </Link>
          </>
        ) : (
          <>
            <p className="text-base">{invite.invitedBy ? t("body", vars) : t("bodyNoBy", vars)}</p>
            {invite.bandName && <p className="text-sm text-neutral-700">{invite.bandName}</p>}
            <p className="text-xs text-neutral-700">{t("notYou", vars)}</p>
            {auth.user && profile ? (
              <NextIntlClientProvider messages={inviteMessages}>
                <AcceptInvite token={token} />
              </NextIntlClientProvider>
            ) : auth.user ? (
              <form action={rememberInviteAction.bind(null, token, "/auth/setup")}>
                <button type="submit" className="btn btn-primary min-h-11">
                  {t("accept")}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <form action={rememberInviteAction.bind(null, token, `/auth/login?next=/invite/${token}`)}>
                    <button type="submit" className="btn btn-primary min-h-11">
                      {t("login")}
                    </button>
                  </form>
                  <form action={rememberInviteAction.bind(null, token, "/auth/register")}>
                    <button type="submit" className="btn btn-secondary min-h-11">
                      {t("register")}
                    </button>
                  </form>
                </div>
                <p className="text-xs text-neutral-700">{t("afterSignup")}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

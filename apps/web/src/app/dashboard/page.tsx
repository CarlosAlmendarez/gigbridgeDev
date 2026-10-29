import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { DEFAULT_DATE_ID, getTourInvite, listMyTours } from "@gigbridge/data";
import { Icon } from "@/components/Icon";
import { NewTourForm } from "@/components/dashboard/NewTourForm";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { tourDataSource } from "@/lib/tourRepository";
import { INVITE_COOKIE } from "@/lib/inviteCookie";

/**
 * Inicio después de iniciar sesión (login, registro, setup y el proxy
 * mandan aquí). Antes no existía y todo usuario terminaba en un 404.
 * Reúne lo que el usuario tiene: sus giras (vía RLS) y, si es venue, su
 * venue. La gira mock aparece solo cuando la app corre con datos de ejemplo.
 */
export default async function DashboardPage() {
  const [supabase, t, locale] = await Promise.all([getSupabaseServerClient(), getTranslations("dashboard"), getLocale()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/auth/setup");

  const demo = tourDataSource() === "mock";
  // Invitación que se abrió antes de iniciar sesión o registrarse (lib/actions/invite.ts).
  const inviteToken = (await cookies()).get(INVITE_COOKIE)?.value;
  const pendingInvite = inviteToken && !demo ? await getTourInvite(supabase, inviteToken) : null;
  const ti = await getTranslations("tour.invite");
  const tours = demo ? [] : await listMyTours(supabase, new Date().toISOString().slice(0, 10));

  // Fechas de calendario (sin hora): se formatean en UTC para que la zona
  // del servidor no las mueva de día.
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const range = (a: string | null, b: string | null) =>
    a && b ? `${fmt.format(new Date(`${a}T12:00:00Z`))} – ${fmt.format(new Date(`${b}T12:00:00Z`))}` : "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-8">
      <div>
        <h1 className="mb-1 font-heading text-3xl font-semibold">{t("greeting", { name: profile.display_name })}</h1>
      </div>

      {pendingInvite?.state === "valid" && (
        <Link href={`/invite/${inviteToken}`} className="card elev-sm flex-row items-center gap-3 p-4 border border-accent">
          <Icon name="envelope-simple" size={22} className="text-accent-800" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{ti("pendingTitle")}</div>
            <div className="text-sm text-neutral-700">{pendingInvite.tourName}</div>
          </div>
          <span className="text-sm text-accent-800">{ti("pendingOpen")}</span>
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">{t("myToursTitle")}</h2>
          <p className="text-sm text-neutral-700">{t("myToursDesc")}</p>
        </div>

        {demo && (
          <Link href={`/tour/${DEFAULT_DATE_ID}/dia`} className="card elev-sm flex-row items-center gap-3 p-4">
            <Icon name="map-trifold" size={22} className="text-accent-800" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{t("demoTourTitle")}</div>
              <div className="text-sm text-neutral-700">{t("demoTourDesc")}</div>
            </div>
            <Icon name="caret-down" size={14} className="-rotate-90 text-neutral-600" />
          </Link>
        )}

        {!demo && tours.length === 0 && (
          <div className="card p-6 text-center">
            <h3 className="font-semibold">{t("noToursTitle")}</h3>
            <p className="mt-1 text-sm text-neutral-700">
              {profile.role === "manager" ? t("noToursManagerDesc") : t("noToursDesc")}
            </p>
          </div>
        )}

        {tours.map((tour) => {
          const body = (
            <>
              <Icon name="map-trifold" size={22} className="text-accent-800" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{tour.name}</span>
                  <span className="tag tag-neutral">{t(`tourStatus_${tour.status}` as "tourStatus_active")}</span>
                </div>
                <div className="text-sm text-neutral-700">
                  {[tour.bandName, t("tourDatesCount", { count: tour.datesCount }), range(tour.firstDate, tour.lastDate)]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
            </>
          );
          return tour.openDateId ? (
            <Link
              key={tour.id}
              href={`/tour/${tour.openDateId}/dia`}
              className="card elev-sm flex-row items-center gap-3 p-4"
              aria-label={`${t("openTour")}: ${tour.name}`}
            >
              {body}
              <Icon name="caret-down" size={14} className="-rotate-90 text-neutral-600" />
            </Link>
          ) : (
            <div key={tour.id} className="card flex-row items-center gap-3 p-4">
              {body}
            </div>
          );
        })}
      </section>

      {profile.role === "manager" && !demo && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("newTourTitle")}</h2>
            <p className="text-sm text-neutral-700">{t("newTourDesc")}</p>
          </div>
          <NewTourForm />
        </section>
      )}

      {profile.role === "venue" && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">{t("myVenueTitle")}</h2>
            <p className="text-sm text-neutral-700">{t("myVenueDesc")}</p>
          </div>
          <Link href="/dashboard/venue" className="card elev-sm flex-row items-center gap-3 p-4">
            <Icon name="buildings" size={22} className="text-accent-800" />
            <span className="flex-1 font-semibold">{t("openVenue")}</span>
            <Icon name="caret-down" size={14} className="-rotate-90 text-neutral-600" />
          </Link>
        </section>
      )}
    </div>
  );
}

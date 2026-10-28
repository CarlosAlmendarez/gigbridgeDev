import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createSupabaseServiceRoleClient } from "@gigbridge/data/server";
import { Icon } from "@/components/Icon";
import { VerifiedBadge } from "@/components/venue/VerifiedBadge";
import { DeleteVenueButton } from "@/components/venue/DeleteVenueButton";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Recorte respecto a v1: sin `ProfileCompleteness` (gamificación) ni
 * `VenueAnalyticsSection` (analítica de vistas) — no son core para
 * "crear un venue y verlo". `is_discoverable` (true solo tras terminar
 * el wizard) reemplaza el % de completeness para saber si el setup
 * quedó a medias.
 */
export default async function VenueDashboardPage() {
  const [supabase, t] = await Promise.all([getSupabaseServerClient(), getTranslations("dashboard")]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("id, role").eq("user_id", user.id).single();
  if (!profile) redirect("/auth/setup");
  if (profile.role !== "venue") redirect("/dashboard");

  const service = createSupabaseServiceRoleClient();
  const { data: venue } = await service.from("venues").select("*").eq("owner_id", profile.id).maybeSingle();

  const setupIncomplete = venue ? !venue.is_discoverable : false;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-800">Dashboard</p>
        <h1 className="mb-1 font-heading text-3xl font-semibold">{t("venueDashTitle")}</h1>
        <p className="text-sm text-neutral-700">{t("venueDashDesc")}</p>
      </div>

      {!venue ? (
        <div className="card elev-md flex flex-col items-center gap-5 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-accent-border bg-accent-100">
            <Icon name="buildings" size={30} className="text-accent-800" />
          </div>
          <div>
            <h2 className="mb-2 text-xl font-bold">{t("registerVenue")}</h2>
            <p className="text-sm text-neutral-700">{t("registerVenueDesc")}</p>
          </div>
          <Link href="/dashboard/venue/setup" className="btn btn-primary">
            <Icon name="plus" size={15} />
            {t("setupVenueCta")}
          </Link>
        </div>
      ) : setupIncomplete ? (
        <div className="flex flex-col gap-4">
          <div className="card elev-md flex flex-col gap-5 p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-accent-border bg-accent-100">
                <Icon name="buildings" size={16} className="text-accent-800" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent-800">{t("setupInProgress")}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{venue.name}</h2>
              <p className="mt-0.5 text-sm text-neutral-600">
                gigbridge.app/venue/{venue.slug}
                {venue.city ? ` · ${venue.city}` : ""}
              </p>
            </div>
            <Link href="/dashboard/venue/setup" className="btn btn-primary btn-block">
              {t("continueSetup")}
              <Icon name="caret-down" size={13} className="-rotate-90" />
            </Link>
          </div>

          <div className="card p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-600">{t("dangerZone")}</p>
            <DeleteVenueButton venueId={venue.id} venueName={venue.name} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="card elev-md p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{venue.name}</h2>
                  <VerifiedBadge is_verified={venue.is_verified} />
                </div>
                <p className="mt-0.5 text-sm text-neutral-600">
                  gigbridge.app/venue/{venue.slug}
                  {venue.city && ` · ${venue.city}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/venue/${venue.slug}`}
                  target="_blank"
                  className="btn btn-icon btn-secondary"
                  aria-label={t("viewPublicVenueProfile")}
                  title={t("viewPublicVenueProfile")}
                >
                  <Icon name="share-network" size={15} />
                </Link>
                <Link
                  href="/dashboard/venue/setup"
                  className="btn btn-icon btn-secondary"
                  aria-label={t("editTechnicalInventory")}
                  title={t("editTechnicalInventory")}
                >
                  <Icon name="pencil-simple" size={15} />
                </Link>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: "users-three", label: t("capacity"), value: venue.capacity ? venue.capacity.toLocaleString() : "—" },
                { icon: "speaker-high", label: "PA", value: venue.has_pa ? t("venueStat_pa_own") : t("venueStat_pa_none") },
                { icon: "headphones", label: t("monitors"), value: venue.floor_monitors_count > 0 ? String(venue.floor_monitors_count) : "0" },
                {
                  icon: "shield-check",
                  label: t("venueStat_verification"),
                  value:
                    venue.verification_status === "approved"
                      ? t("venueStat_approved")
                      : venue.verification_status === "pending"
                        ? t("venueStat_pending")
                        : t("venueStat_pendingDefault"),
                },
              ].map(({ icon, label, value }) => (
                <div key={label} className="card p-3">
                  <Icon name={icon} size={16} className="mb-1.5 text-accent-800" />
                  <p className="text-sm font-bold">{value}</p>
                  <p className="text-[10px] text-neutral-600">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card elev-md p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-600">{t("venueActions")}</p>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/venue/setup" className="card !flex-row items-center gap-3 px-4 py-3">
                <Icon name="pencil-simple" size={15} className="text-accent-800" />
                <span className="text-sm">{t("editTechnicalInventory")}</span>
              </Link>
              <Link href={`/venue/${venue.slug}`} target="_blank" className="card !flex-row items-center gap-3 px-4 py-3">
                <Icon name="share-network" size={15} className="text-neutral-600" />
                <span className="text-sm">{t("viewPublicVenueProfile")}</span>
              </Link>
              <div className="mt-2 border-t border-divider pt-2">
                <DeleteVenueButton venueId={venue.id} venueName={venue.name} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

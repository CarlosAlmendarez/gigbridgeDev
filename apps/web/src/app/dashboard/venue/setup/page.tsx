import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createSupabaseServiceRoleClient } from "@gigbridge/data/server";
import { Icon } from "@/components/Icon";
import { VenueSetupWizard } from "@/components/venue/VenueSetupWizard";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function VenueSetupPage() {
  const [supabase, t] = await Promise.all([getSupabaseServerClient(), getTranslations("venue")]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("id, display_name, role").eq("user_id", user.id).single();
  if (!profile) redirect("/auth/setup");

  const service = createSupabaseServiceRoleClient();
  const { data: venue } = await service.from("venues").select("*").eq("owner_id", profile.id).maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <Link href="/dashboard/venue" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
          <Icon name="arrow-left" size={13} />
          {t("setup_back")}
        </Link>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-800">Dashboard → Venue</p>
        <h1 className="mb-2 font-heading text-3xl font-semibold">{venue ? t("setup_editTitle") : t("setup_createTitle")}</h1>
        <p className="text-sm text-neutral-700">{venue ? t("setup_editDesc") : t("setup_createDesc")}</p>
      </div>

      <div className="card elev-md p-6">
        <VenueSetupWizard profileId={profile.id} initialVenueId={venue?.id} initialData={venue ?? undefined} />
      </div>
    </div>
  );
}

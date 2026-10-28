import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/Icon";
import { VerifiedBadge } from "@/components/venue/VerifiedBadge";
import { getSupabaseServerClient } from "@/lib/supabase-server";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Versión recortada de VenuePublicProfile.tsx de v1 (~800 líneas, con
 * secciones de salas de ensayo y rider vinculado que quedaron fuera de
 * este plan): identidad, specs técnicas y galería. Usa el cliente
 * normal (no service-role) para que la RLS de `venues`
 * (is_discoverable = true, o dueño) decida qué es visible — v1 hacía
 * esta verificación a mano con el cliente service-role.
 */
export default async function VenuePublicPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();
  const t = await getTranslations("venue");

  const { data: venue } = await supabase.from("venues").select("*").eq("slug", slug).maybeSingle();
  if (!venue) notFound();

  const specs: Array<{ label: string; value: string }> = [
    venue.capacity ? { label: t("capacity"), value: venue.capacity.toLocaleString() } : null,
    venue.stage_width_m && venue.stage_depth_m ? { label: "Escenario", value: `${venue.stage_width_m}×${venue.stage_depth_m} m` } : null,
    venue.has_pa ? { label: "PA", value: [venue.pa_brand, venue.pa_model].filter(Boolean).join(" ") || "Sí" } : null,
    venue.has_foh_console
      ? { label: "FOH", value: [venue.foh_console_brand, venue.foh_console_model].filter(Boolean).join(" ") || "Sí" }
      : null,
    venue.floor_monitors_count > 0 ? { label: t("monitors"), value: String(venue.floor_monitors_count) } : null,
    venue.has_backline_loan ? { label: "Backline", value: "Sí" } : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  const socialLinks: Array<{ icon: string; url: string }> = [
    venue.instagram_url ? { icon: "instagram-logo", url: venue.instagram_url } : null,
    venue.facebook_url ? { icon: "facebook-logo", url: venue.facebook_url } : null,
    venue.tiktok_url ? { icon: "tiktok-logo", url: venue.tiktok_url } : null,
    venue.twitter_url ? { icon: "x-logo", url: venue.twitter_url } : null,
    venue.website_url ? { icon: "globe", url: venue.website_url } : null,
  ].filter((s): s is { icon: string; url: string } => s !== null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="relative mb-6 h-48 w-full overflow-hidden rounded-md bg-surface sm:h-64">
        {venue.cover_photo_url && <Image src={venue.cover_photo_url} alt={venue.name} fill className="object-cover" />}
      </div>

      <div className="mb-6 flex flex-wrap items-start gap-4">
        {venue.logo_url && (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-divider bg-surface">
            <Image src={venue.logo_url} alt={venue.name} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">{venue.name}</h1>
            <VerifiedBadge is_verified={venue.is_verified} />
          </div>
          <p className="text-sm text-neutral-700">
            {venue.city}
            {venue.state_region ? `, ${venue.state_region}` : ""}
          </p>
        </div>
        {socialLinks.length > 0 && (
          <div className="flex gap-2">
            {socialLinks.map(({ icon, url }) => (
              <a key={icon} href={url} target="_blank" rel="noopener noreferrer" className="btn btn-icon btn-secondary">
                <Icon name={icon} size={15} />
              </a>
            ))}
          </div>
        )}
      </div>

      {venue.description && <p className="mb-6 text-sm leading-relaxed text-neutral-700">{venue.description}</p>}

      {specs.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {specs.map((s) => (
            <div key={s.label} className="card p-3">
              <p className="text-[10px] uppercase tracking-[0.08em] text-neutral-600">{s.label}</p>
              <p className="mt-0.5 text-sm font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {venue.photos && venue.photos.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-bold">Galería</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {venue.photos.map((url: string) => (
              <div key={url} className="relative overflow-hidden rounded-md border border-divider bg-surface" style={{ aspectRatio: "16/9" }}>
                <Image src={url} alt={venue.name} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: venue } = await supabase.from("venues").select("name, description").eq("slug", slug).maybeSingle();
  if (!venue) return {};
  return { title: `${venue.name} — GigBridge`, description: venue.description ?? undefined };
}

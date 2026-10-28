"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { VenueImageUploader } from "@/components/venue/VenueImageUploader";
import { VenueGalleryUploader } from "@/components/venue/VenueGalleryUploader";
import type { VenueRow } from "@gigbridge/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface Props {
  profileId: string;
  venueId: string | null;
  initialData?: Partial<VenueRow>;
  onSaved: (venueId: string, data: Partial<VenueRow>) => void;
}

/**
 * Port de v1, sin el bloque de "vincular rider" del final del step
 * original (queda para cuando exista UI del sistema de documentos
 * polimórfico) — aquí termina en identidad + redes + fotos.
 */
export function Step1Identity({ profileId, venueId, initialData, onSaved }: Props) {
  const t = useTranslations("venue_wizard");
  const [phase, setPhase] = useState<"info" | "media">(() => (venueId ? "media" : "info"));
  const [localVenueId, setLocalVenueId] = useState<string | null>(venueId);
  const [localVenueData, setLocalVenueData] = useState<Partial<VenueRow>>(initialData ?? {});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const infoSchema = z.object({
    name: z.string().min(2, t("valMinName")),
    slug: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    city: z.string().min(2, t("valCityRequired")),
    state_region: z.string().optional(),
    address: z.string().optional(),
    google_maps_url: z.string().url(t("valInvalidUrl")).optional().or(z.literal("")),
  });
  type InfoData = z.infer<typeof infoSchema>;

  const {
    register: regInfo,
    handleSubmit: handleInfo,
    setValue: setInfoVal,
    formState: { errors: infoErrors },
  } = useForm<InfoData>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      city: initialData?.city ?? "",
      state_region: initialData?.state_region ?? "",
      address: initialData?.address ?? "",
      google_maps_url: initialData?.google_maps_url ?? "",
    },
  });

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    regInfo("name").onChange(e);
    if (!localVenueId) setInfoVal("slug", slugify(e.target.value));
  }

  function onInfoSubmit(data: InfoData) {
    setError(null);
    startTransition(async () => {
      const payload = {
        owner_id: profileId,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        city: data.city,
        state_region: data.state_region || null,
        address: data.address || null,
        google_maps_url: data.google_maps_url || null,
        ...(initialData?.venue_type ? { venue_type: initialData.venue_type } : {}),
      };

      if (localVenueId) {
        const res = await fetch("/api/venues/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueId: localVenueId, ...payload }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(json.error ?? t("id1ErrorSave"));
          return;
        }
        setLocalVenueData((prev) => ({ ...prev, ...payload }));
        setPhase("media");
      } else {
        const res = await fetch("/api/venues/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            city: data.city,
            state_region: data.state_region || null,
            address: data.address || null,
            google_maps_url: data.google_maps_url || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          if (res.status === 409 && json.venueId) {
            setLocalVenueId(json.venueId as string);
            setLocalVenueData((prev) => ({ ...prev, id: json.venueId as string }));
            setPhase("media");
            return;
          }
          setError(json.error ?? t("id1ErrorCreate"));
          return;
        }
        const id = json.id as string;
        setLocalVenueId(id);
        setLocalVenueData((prev) => ({ ...prev, ...payload, id }));
        setPhase("media");
      }
    });
  }

  const socialSchema = z.object({
    instagram_url: z.string().url(t("valInvalidUrl")).optional().or(z.literal("")),
    facebook_url: z.string().url(t("valInvalidUrl")).optional().or(z.literal("")),
    twitter_url: z.string().url(t("valInvalidUrl")).optional().or(z.literal("")),
    tiktok_url: z.string().url(t("valInvalidUrl")).optional().or(z.literal("")),
    website_url: z.string().url(t("valInvalidUrl")).optional().or(z.literal("")),
  });
  type SocialData = z.infer<typeof socialSchema>;

  const {
    register: regSocial,
    handleSubmit: handleSocial,
    formState: { errors: socialErrors },
  } = useForm<SocialData>({
    resolver: zodResolver(socialSchema),
    defaultValues: {
      instagram_url: initialData?.instagram_url ?? "",
      facebook_url: initialData?.facebook_url ?? "",
      twitter_url: initialData?.twitter_url ?? "",
      tiktok_url: initialData?.tiktok_url ?? "",
      website_url: initialData?.website_url ?? "",
    },
  });

  function onSocialSubmit(data: SocialData) {
    setError(null);
    startTransition(async () => {
      const payload = {
        instagram_url: data.instagram_url || null,
        facebook_url: data.facebook_url || null,
        twitter_url: data.twitter_url || null,
        tiktok_url: data.tiktok_url || null,
        website_url: data.website_url || null,
      };
      const res = await fetch("/api/venues/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: localVenueId!, ...payload }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? t("id1ErrorSave"));
        return;
      }
      onSaved(localVenueId!, { ...localVenueData, ...payload });
    });
  }

  if (phase === "info") {
    return (
      <form onSubmit={handleInfo(onInfoSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("id1VenueName")}</label>
            <input {...regInfo("name")} onChange={handleNameChange} placeholder="Foro Indie Fest" className="input" />
            {infoErrors.name && <p className="mt-1 text-xs text-red-500">{infoErrors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("id1Slug")}</label>
            <div className="input flex items-center overflow-hidden p-0">
              <span className="flex-shrink-0 whitespace-nowrap pl-3 pr-1 text-xs text-neutral-500">gigbridge.app/venue/</span>
              <input {...regInfo("slug")} placeholder="foro-indie-fest" className="min-w-0 flex-1 bg-transparent py-2 pr-2 text-sm outline-none" />
            </div>
            {infoErrors.slug && <p className="mt-1 text-xs text-red-500">{infoErrors.slug.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("id1Description")}</label>
          <textarea {...regInfo("description")} rows={3} placeholder={t("id1DescPh")} className="input" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("id1City")}</label>
            <input {...regInfo("city")} placeholder="Ciudad de México" className="input" />
            {infoErrors.city && <p className="mt-1 text-xs text-red-500">{infoErrors.city.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("id1Region")}</label>
            <input {...regInfo("state_region")} placeholder="CDMX" className="input" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("id1Address")}</label>
          <input {...regInfo("address")} placeholder="Av. Insurgentes Sur 3000" className="input" />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("id1MapsUrl")}</label>
          <input {...regInfo("google_maps_url")} type="url" placeholder="https://maps.google.com/..." className="input" />
          {infoErrors.google_maps_url && <p className="mt-1 text-xs text-red-500">{infoErrors.google_maps_url.message}</p>}
        </div>

        {error && <p className="px-1 text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={isPending} className="btn btn-primary btn-block">
          {isPending ? t("wizSaving") : t("wizSave")}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={() => setPhase("info")} className="w-fit text-xs text-neutral-600">
        {t("id2BackToInfo")}
      </button>

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold">{t("id2PhotosTitle")}</p>
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-neutral-600">{t("id2Optional")}</span>
        </div>

        <VenueImageUploader
          venueId={localVenueId!}
          bucket="covers"
          pathKey="cover"
          currentUrl={localVenueData.cover_photo_url ?? null}
          label={t("id2CoverLabel")}
          hint={t("id2CoverHint")}
          aspect="cover"
          onUploaded={(url) => setLocalVenueData((prev) => ({ ...prev, cover_photo_url: url }))}
        />

        <VenueImageUploader
          venueId={localVenueId!}
          bucket="avatars"
          pathKey="logo"
          currentUrl={localVenueData.logo_url ?? null}
          label={t("id2LogoLabel")}
          hint={t("id2LogoHint")}
          aspect="logo"
          onUploaded={(url) => setLocalVenueData((prev) => ({ ...prev, logo_url: url }))}
        />

        <VenueGalleryUploader
          venueId={localVenueId!}
          currentPhotos={localVenueData.photos ?? []}
          onChange={(photos) => setLocalVenueData((prev) => ({ ...prev, photos }))}
        />
      </div>

      <div className="border-t border-divider" />

      <form onSubmit={handleSocial(onSocialSubmit)} className="flex flex-col gap-4">
        <p className="text-sm font-bold">{t("id2SocialTitle")}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              { name: "instagram_url" as const, icon: "instagram-logo", label: "Instagram", placeholder: "https://instagram.com/mivenue" },
              { name: "facebook_url" as const, icon: "facebook-logo", label: "Facebook", placeholder: "https://facebook.com/mivenue" },
              { name: "tiktok_url" as const, icon: "tiktok-logo", label: "TikTok", placeholder: "https://tiktok.com/@mivenue" },
              { name: "twitter_url" as const, icon: "x-logo", label: "X / Twitter", placeholder: "https://x.com/mivenue" },
            ]
          ).map(({ name, icon, label, placeholder }) => (
            <div key={name}>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{label}</label>
              <div className="input flex items-center gap-0 overflow-hidden p-0">
                <span className="flex h-full flex-shrink-0 items-center justify-center border-r border-divider bg-surface px-2.5">
                  <Icon name={icon} size={14} className="text-neutral-500" />
                </span>
                <input {...regSocial(name)} type="url" placeholder={placeholder} className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" />
              </div>
              {socialErrors[name] && <p className="mt-1 text-xs text-red-500">{socialErrors[name]?.message}</p>}
            </div>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("id2Website")}</label>
          <div className="input flex items-center gap-0 overflow-hidden p-0">
            <span className="flex h-full flex-shrink-0 items-center justify-center border-r border-divider bg-surface px-2.5">
              <Icon name="globe" size={14} className="text-neutral-500" />
            </span>
            <input {...regSocial("website_url")} type="url" placeholder="https://www.mivenue.com" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" />
          </div>
          {socialErrors.website_url && <p className="mt-1 text-xs text-red-500">{socialErrors.website_url.message}</p>}
        </div>

        {error && <p className="px-1 text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={isPending} className="btn btn-primary btn-block">
          {isPending ? t("wizSaving") : t("wizSave")}
        </button>
      </form>
    </div>
  );
}

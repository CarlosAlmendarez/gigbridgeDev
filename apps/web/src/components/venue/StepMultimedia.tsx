"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { VenueStepActions } from "@/components/venue/VenueStepActions";
import type { VenueRow } from "@gigbridge/types";

interface Props {
  venueId: string;
  initialData?: Partial<VenueRow>;
  onSaved: (venueId: string, data: Partial<VenueRow>) => void;
  onBack: () => void;
}

const VIDEO_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/|vimeo\.com\/(?:video\/|\d+$))([a-zA-Z0-9_-]+)/;

function extractVideoEmbed(url: string): { type: "youtube" | "vimeo"; src: string } | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (yt) return { type: "youtube", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: "vimeo", src: `https://player.vimeo.com/video/${vm[1]}` };
  return null;
}

/**
 * Recorte deliberado de v1: aquí solo queda el video promocional
 * (promo_video_url). El bloque de "vincular rider técnico" de v1 quedó
 * fuera — necesita el sistema de documentos polimórfico (documents/
 * document_versions) que todavía no tiene UI propia.
 */
export function StepMultimedia({ venueId, initialData, onSaved, onBack }: Props) {
  const t = useTranslations("venue_wizard");
  const [isPending, startTransition] = useTransition();
  const [videoUrl, setVideoUrl] = useState(initialData?.promo_video_url ?? "");
  const [videoError, setVideoError] = useState<string | null>(null);

  const embedInfo = videoUrl.trim() ? extractVideoEmbed(videoUrl.trim()) : null;
  const videoIsValid = !videoUrl.trim() || !!embedInfo || VIDEO_REGEX.test(videoUrl);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVideoError(null);
    if (videoUrl.trim() && !embedInfo) {
      setVideoError(t("sMultiVideoErrorUrl"));
      return;
    }
    startTransition(async () => {
      const payload = { promo_video_url: videoUrl.trim() || null };
      const res = await fetch("/api/venues/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, ...payload }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setVideoError(json.error ?? t("sMultiErrorSave"));
        return;
      }
      onSaved(venueId, payload);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="mb-3 text-sm font-bold">{t("sMultiVideoTitle")}</p>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("sMultiVideoUrl")}</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setVideoError(null);
            }}
            placeholder="https://youtube.com/watch?v=..."
            className={["input", videoError ? "border-red-400" : ""].join(" ")}
          />
          {videoError && <p className="mt-1 text-xs text-red-500">{videoError}</p>}
        </div>

        {embedInfo && (
          <div className="mt-3 overflow-hidden rounded-md bg-black" style={{ aspectRatio: "16/9" }}>
            <iframe
              src={embedInfo.src}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video preview"
            />
          </div>
        )}
        {videoUrl.trim() && !embedInfo && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-red-300 bg-red-50 p-3">
            <Icon name="warning-circle" size={15} className="flex-shrink-0 text-red-500" />
            <p className="text-xs text-red-600">{t("sMultiVideoInvalidNote")}</p>
          </div>
        )}
      </div>

      <VenueStepActions onBack={onBack} pending={isPending} disabled={!videoIsValid} />
    </form>
  );
}

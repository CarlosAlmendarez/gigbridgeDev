"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  venueId: string;
  currentPhotos: string[];
  onChange: (photos: string[]) => void;
}

export function VenueGalleryUploader({ venueId, currentPhotos, onChange }: Props) {
  const t = useTranslations("venue_wizard");
  const [photos, setPhotos] = useState<string[]>(currentPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    const newUrls: string[] = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(t("galleryFormatError"));
        break;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(t("galleryFileSizeError", { mb: MAX_SIZE_MB }));
        break;
      }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("venueId", venueId);
      fd.append("pathKey", "gallery");
      fd.append("bucket", "covers");
      const res = await fetch("/api/venues/upload-image", { method: "POST", body: fd });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(json.error ?? t("galleryUploadError"));
        break;
      }
      newUrls.push(json.url!);
    }

    if (newUrls.length > 0) {
      const updated = [...photos, ...newUrls];
      setPhotos(updated);
      onChange(updated);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function removePhoto(url: string) {
    const updated = photos.filter((p) => p !== url);
    setPhotos(updated);
    onChange(updated);
    await fetch("/api/venues/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId, photos: updated }),
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon name="images" size={15} className="text-neutral-600" />
        <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("galleryTitle")}</label>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-neutral-600">{t("galleryOptional")}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <div key={url} className="relative overflow-hidden rounded-md border border-divider bg-surface" style={{ aspectRatio: "16/9" }}>
            <Image src={url} alt={t("galleryPhotoAlt", { n: i + 1 })} fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65"
            >
              <Icon name="x" size={11} className="text-white" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-divider"
          style={{ aspectRatio: "16/9" }}
        >
          <Icon name={uploading ? "circle-notch" : "plus"} size={18} className={["text-neutral-500", uploading ? "animate-spin" : ""].join(" ")} />
          <span className="text-[10px] text-neutral-600">{uploading ? t("galleryUploading") : t("galleryAdd")}</span>
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <p className="mt-1.5 text-xs text-neutral-600">{t("galleryHint")}</p>
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(",")} multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}

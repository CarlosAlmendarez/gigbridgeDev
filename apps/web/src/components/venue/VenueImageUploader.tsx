"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  venueId: string;
  bucket: "covers" | "avatars";
  pathKey: "cover" | "logo";
  currentUrl: string | null;
  label: string;
  hint: string;
  aspect: "cover" | "logo";
  onUploaded: (url: string | null) => void;
}

export function VenueImageUploader({ venueId, bucket, pathKey, currentUrl, label, hint, aspect, onUploaded }: Props) {
  const t = useTranslations("venue_wizard");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayed = preview ?? currentUrl;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t("imgFormatError"));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(t("imgSizeError", { mb: MAX_SIZE_MB }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    upload(file);
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("venueId", venueId);
      fd.append("pathKey", pathKey);
      fd.append("bucket", bucket);

      const res = await fetch("/api/venues/upload-image", { method: "POST", body: fd });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? t("imgUploadError"));

      onUploaded(json.url!);
      setPreview(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("imgUploadError"));
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setUploading(true);
    try {
      const column = pathKey === "cover" ? "cover_photo_url" : "logo_url";
      const res = await fetch("/api/venues/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, [column]: null }),
      });
      if (!res.ok) throw new Error(t("imgDeleteError"));
      onUploaded(null);
      setPreview(null);
    } catch {
      setError(t("imgDeleteError"));
    } finally {
      setUploading(false);
    }
  }

  if (aspect === "cover") {
    return (
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{label}</label>
        <div
          className="group relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-divider bg-surface"
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {displayed ? (
            <Image src={displayed} alt="Cover" fill className="object-cover" unoptimized={!!preview} />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Icon name="image-square" size={22} className="text-neutral-500" />
              <p className="text-xs text-neutral-600">{t("imgCoverPh")}</p>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Icon name={uploading ? "circle-notch" : "camera"} size={22} className={["text-white", uploading ? "animate-spin" : ""].join(" ")} />
          </div>
          {displayed && !uploading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove();
              }}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60"
            >
              <Icon name="x" size={13} className="text-white" />
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <p className="mt-1 text-xs text-neutral-600">{hint}</p>
        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(",")} className="hidden" onChange={handleFile} />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{label}</label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          className="group relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-divider bg-surface"
        >
          {displayed ? (
            <Image src={displayed} alt="Logo" fill className="object-cover" unoptimized={!!preview} />
          ) : (
            <Icon name="camera" size={18} className="text-neutral-500" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            <Icon name={uploading ? "circle-notch" : "camera"} size={18} className={["text-white", uploading ? "animate-spin" : ""].join(" ")} />
          </div>
        </button>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => !uploading && inputRef.current?.click()}
            disabled={uploading}
            className="btn btn-secondary w-fit py-1 text-xs"
          >
            {uploading ? t("imgUploading") : currentUrl ? t("imgChangeLogo") : t("imgUploadLogo")}
          </button>
          <p className="text-xs text-neutral-600">{hint}</p>
          {currentUrl && !uploading && (
            <button type="button" onClick={remove} className="w-fit text-xs text-neutral-600">
              {t("imgDelete")}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(",")} className="hidden" onChange={handleFile} />
    </div>
  );
}

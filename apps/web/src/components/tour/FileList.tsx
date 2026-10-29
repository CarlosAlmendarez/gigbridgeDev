"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { UPLOAD_DOCUMENT_TYPES, UPLOAD_TYPES, type mapFiles } from "@gigbridge/data";

type MappedFile = ReturnType<typeof mapFiles>[number];

/** Lista de documentos con su vigencia; compartida por Show, Lugar y Documentos. */
export function FileList({ files }: { files: MappedFile[] }) {
  return (
    <>
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Icon name={f.icon} size={23} className="text-accent-700" />
          <div className="flex-1 min-w-0">
            {f.url ? (
              <a className="font-heading font-semibold text-[15px] break-words underline" href={f.url} target="_blank" rel="noopener">
                {f.name}
              </a>
            ) : (
              <div className="font-heading font-semibold text-[15px] break-words">{f.name}</div>
            )}
            <div className="text-xs text-neutral-700">{f.meta}</div>
          </div>
          <span className={f.tagClass}>{f.tagLabel}</span>
        </div>
      ))}
    </>
  );
}

/** Gira de ejemplo: agrega un archivo simulado en memoria (no se sube nada). */
export function UploadButton({ label, onUpload }: { label: string; onUpload: () => void }) {
  return (
    <button type="button" className="btn btn-secondary btn-block min-h-[42px]" onClick={onUpload}>
      <Icon name="upload-simple" size={17} />
      {label}
    </button>
  );
}

/**
 * Con datos reales: sube un documento técnico a la fecha por el Route
 * Handler /api/v1/tour-dates/:id/documents (service role para Storage, el
 * permiso lo decide la sesión). Solo se muestra a quien puede subir.
 */
export function LiveUploadForm({ dateId }: { dateId: string }) {
  const t = useTranslations("tour");
  const { uploadDocument } = useTourUI();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) {
    return (
      <div>
        <button type="button" className="btn btn-secondary btn-block min-h-[42px]" onClick={() => (setOpen(true), setDone(false))}>
          <Icon name="upload-simple" size={17} />
          {t("show.upload")}
        </button>
        <p className="text-xs text-neutral-700 mt-1">{done ? t("show.uploadDone") : t("show.uploadHelp")}</p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 border border-divider rounded-md p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const ok = await uploadDocument(dateId, new FormData(e.currentTarget));
        setBusy(false);
        if (ok) {
          setOpen(false);
          setDone(true);
        }
      }}
    >
      <label className="text-xs text-neutral-700 flex flex-col gap-1">
        {t("show.uploadFile")}
        <input
          className="text-sm"
          type="file"
          name="file"
          accept={Object.keys(UPLOAD_TYPES).join(",")}
          required
          onChange={(e) => {
            const title = e.currentTarget.form?.elements.namedItem("title") as HTMLInputElement | null;
            const name = e.currentTarget.files?.[0]?.name;
            if (title && !title.value && name) title.value = name.replace(/\.[^.]+$/, "");
          }}
        />
      </label>
      <label className="text-xs text-neutral-700 flex flex-col gap-1">
        {t("show.uploadTitle")}
        <input className="input min-h-[42px]" type="text" name="title" required />
      </label>
      <label className="text-xs text-neutral-700 flex flex-col gap-1">
        {t("show.uploadType")}
        <select className="input min-h-[42px]" name="type" defaultValue={UPLOAD_DOCUMENT_TYPES[0]}>
          {UPLOAD_DOCUMENT_TYPES.map((k) => (
            <option key={k} value={k}>
              {t(`show.docType_${k}`)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary min-h-[42px]" disabled={busy}>
          {busy ? t("show.uploading") : t("show.uploadSubmit")}
        </button>
        <button type="button" className="btn btn-ghost min-h-[42px]" onClick={() => setOpen(false)} disabled={busy}>
          {t("sync.close")}
        </button>
      </div>
    </form>
  );
}

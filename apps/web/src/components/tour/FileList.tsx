"use client";

import { Icon } from "@/components/Icon";
import type { mapFiles } from "@gigbridge/data";

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

/**
 * Con la gira de ejemplo agrega un archivo simulado; con datos reales la
 * carga a Storage todavía no existe, así que se muestra deshabilitado y lo
 * dice, en vez de fingir que subió algo.
 */
export function UploadButton({ live, label, onUpload }: { live: boolean; label: string; onUpload: () => void }) {
  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary btn-block min-h-[42px] disabled:opacity-50"
        onClick={onUpload}
        disabled={live}
      >
        <Icon name="upload-simple" size={17} />
        {label}
      </button>
      {live && <p className="text-xs text-neutral-700 mt-1">La carga de archivos todavía no está disponible.</p>}
    </div>
  );
}

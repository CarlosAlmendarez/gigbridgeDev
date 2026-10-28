"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { mapFiles } from "@gigbridge/data";
import type { TourDate } from "@gigbridge/types";
import { FileList } from "./FileList";

export function RiderView({ dateId, tourDate }: { dateId: string; tourDate: TourDate }) {
  const { source } = useTourUI();
  return source === "supabase" ? (
    <LiveDocuments dateId={dateId} d={tourDate} />
  ) : (
    <PrototypeRider dateId={dateId} />
  );
}

/**
 * Documentos ligados a la fecha (tour_date_document_refs, 0007) y su
 * vigencia: "Revisar" = el venue o la banda publicó una versión más nueva
 * que la que usa esta fecha. Un admin la adopta y la fecha pasa a vigente.
 */
function LiveDocuments({ dateId, d }: { dateId: string; d: TourDate }) {
  const { adoptDocument } = useTourUI();
  const files = mapFiles(d.show.docs);
  const outdated = files.filter((f) => f.status === "revisar" && f.documentId);

  return (
    <div className="pt-6 max-w-[760px]">
      <Link className="btn btn-ghost min-h-10 pl-0" href={`/tour/${dateId}/dia`}>
        <Icon name="arrow-left" size={18} />
        Hoja del día
      </Link>
      <div className="text-xs tracking-[0.1em] uppercase text-neutral-700 pt-2">{d.dateline}</div>
      <h1 className="text-[40px] sm:text-[44px] my-1 mb-2 tracking-[-0.03em]">Documentos y versiones</h1>
      <p className="text-base m-0 max-w-[60ch]">
        Cada fecha usa una versión concreta de cada documento (rider, plano, patch list). Si el dueño publica una versión
        más nueva, la fecha no cambia sola: aparece como <strong>Revisar</strong> hasta que un admin de la gira la adopte.
      </p>

      <div className="pt-6">
        {files.length === 0 ? (
          <p className="text-sm text-neutral-700">Esta fecha todavía no tiene documentos ligados.</p>
        ) : (
          <FileList files={files} />
        )}
      </div>

      {outdated.length > 0 && (
        <div className="pt-6">
          <h6 className="mb-1">Versiones nuevas disponibles</h6>
          <p className="text-xs text-neutral-700 mb-3">
            Al adoptar, esta fecha pasa a usar la versión vigente. Asegúrate de reenviarla a quien la necesite.
          </p>
          <div className="flex flex-col gap-2">
            {outdated.map((f) => (
              <div key={f.documentId} className="flex items-center gap-3">
                <span className="flex-1 min-w-0 text-sm break-words">{f.name}</span>
                <button type="button" className="btn btn-secondary min-h-10" onClick={() => adoptDocument(dateId, f.documentId!)}>
                  Usar la versión vigente
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-6 text-xs text-neutral-700 flex flex-col gap-1">
        <div>
          <span className="tag tag-accent">Vigente</span> la fecha usa la versión más reciente.
        </div>
        <div>
          <span className="tag tag-accent-2">Revisar</span> hay una versión más nueva que la que usa esta fecha.
        </div>
        <div>
          <span className="tag tag-outline">Pendiente de subir</span> el documento existe pero no tiene archivo todavía.
        </div>
      </div>
    </div>
  );
}

/** Gira de ejemplo: la pantalla del prototipo de Claude Design. */
function PrototypeRider({ dateId }: { dateId: string }) {
  const { adopted: adoptedState, adoptRider } = useTourUI();
  const stale = true; // riderDesactualizado default
  const adopted = adoptedState === null ? !stale : adoptedState;

  const v3TagClass = adopted ? "tag tag-neutral" : "tag tag-accent-2";
  const v3TagLabel = adopted ? "Reemplazada" : "En uso en esta fecha";
  const adoptLabel = adopted ? "v4 aplicada" : "Usar v4 aquí";

  return (
    <div className="pt-6">
      <Link className="btn btn-ghost min-h-10 pl-0" href={`/tour/${dateId}/dia`}>
        <Icon name="arrow-left" size={18} />
        Hoja del día
      </Link>
      <div className="text-xs tracking-[0.1em] uppercase text-neutral-700 pt-2">Rider técnico</div>
      <h1 className="text-[44px] my-1 mb-2 tracking-[-0.03em]">Las Bestias del Valle</h1>
      <p className="text-base max-w-[56ch] m-0">
        Esta fecha quedó congelada a la versión que se mandó en el avance. La banda publicó una versión más nueva
        después.
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-8 pt-6">
        <div className="min-w-0 flex flex-col gap-2">
          <div className="card elev-sm">
            <div className="flex items-center gap-2">
              <span className="card-kicker mr-auto">v4 · publicada 8 sep</span>
              <span className="tag tag-accent">Vigente</span>
            </div>
            <div className="card-title">Input list 32 canales · nuevo split de Patch Master</div>
            <p className="card-body">
              Cambios contra v3: se agregan 2 líneas de sample pad, se mueve el clic al canal 31 y cambia la marca de
              monitores in-ear.
            </p>
            <div className="card-meta">
              <Icon name="user-circle" size={15} />
              <span>Subida por Phil G. · Tour Manager</span>
            </div>
            <div className="flex gap-2">
              <a className="btn btn-primary min-h-11" href="#">
                <Icon name="file-pdf" size={17} />
                Abrir PDF
              </a>
              <button type="button" className="btn btn-secondary min-h-11" onClick={adoptRider}>
                {adoptLabel}
              </button>
            </div>
          </div>
          <div className="card elev-sm">
            <div className="flex items-center gap-2">
              <span className="card-kicker mr-auto">v3 · publicada 14 ago</span>
              <span className={v3TagClass}>{v3TagLabel}</span>
            </div>
            <div className="card-title">Input list 30 canales</div>
            <p className="card-body">Es la versión que recibió el Patch Master del Foro Cantera en el avance del 2 sep.</p>
            <div className="card-meta">
              <Icon name="paperclip" size={15} />
              <span>Adjunta al contrato de esta fecha</span>
            </div>
          </div>
          <div className="card">
            <div className="card-kicker">v2 · 3 jun</div>
            <div className="card-title">Input list 30 canales · sin sample pad</div>
            <div className="card-meta">
              <span>Archivada</span>
            </div>
          </div>
        </div>
        <div>
          <h6 className="mb-3">Quién tiene qué versión</h6>
          <table className="table">
            <thead>
              <tr>
                <th>Destinatario</th>
                <th>Versión</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Patch Master · Foro Cantera</td>
                <td>
                  <span className="tag tag-accent-2">v3</span>
                </td>
              </tr>
              <tr>
                <td>Sonido Sierra (audio)</td>
                <td>
                  <span className="tag tag-accent-2">v3</span>
                </td>
              </tr>
              <tr>
                <td>Lumen Norte (luces)</td>
                <td>
                  <span className="tag tag-accent">v4</span>
                </td>
              </tr>
              <tr>
                <td>Stage Manager · gira</td>
                <td>
                  <span className="tag tag-accent">v4</span>
                </td>
              </tr>
            </tbody>
          </table>
          <button type="button" className="btn btn-secondary min-h-11 mt-3">
            <Icon name="share-network" size={17} />
            Reenviar v4 a los que traen v3
          </button>
        </div>
      </div>
    </div>
  );
}

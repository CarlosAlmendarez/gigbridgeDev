"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { mapFiles } from "@gigbridge/data";
import type { TourDate } from "@gigbridge/types";
import { FileList, UploadButton } from "./FileList";

export function LugarView({ dateId, tourDate: d }: { dateId: string; tourDate: TourDate }) {
  const venue = d.venue;
  const {
    source,
    extraVenueFiles,
    extraVenueNotes,
    venueNoteDraft,
    setVenueNoteDraft,
    addVenueNote,
    addVenueFile,
  } = useTourUI();

  const venueFiles = mapFiles(venue.files.concat(extraVenueFiles[dateId] || []));
  const venueNotes = (extraVenueNotes[dateId] || []).concat(venue.notes);
  const filesCount = venue.files.length + (extraVenueFiles[dateId] || []).length;
  const filesMeta = filesCount === 1 ? "1 archivo" : `${filesCount} archivos`;
  const live = source === "supabase";
  const hasSite = Boolean(venue.site) && venue.site !== "#";

  if (d.kind === "Viaje" && venue.specs.length === 0) {
    return (
      <div className="pt-6 max-w-[60ch]">
        <div className="text-xs tracking-[0.1em] uppercase text-neutral-700">{d.dateline}</div>
        <h1 className="text-[40px] sm:text-[48px] my-1 mb-2 tracking-[-0.03em]">Sin recinto</h1>
        <p className="text-base">
          Es un día de viaje: no hay venue que mostrar. La logística del traslado está en la hoja del día.
        </p>
        <Link className="btn btn-primary min-h-11 mt-4" href={`/tour/${dateId}/dia`}>
          <Icon name="calendar-dot" />
          Ir a la hoja del día
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="flex items-end gap-6 flex-wrap">
        <div className="flex-[1_1_360px] min-w-[320px]">
          <div className="text-xs tracking-[0.1em] uppercase text-neutral-700">{venue.kicker}</div>
          <h1 className="text-[40px] sm:text-[48px] my-1 mb-2 tracking-[-0.03em]">{venue.name}</h1>
          <div className="text-base leading-[1.55] whitespace-pre-line">{venue.address}</div>
          <div className="flex flex-wrap gap-1 mt-3">
            <span className="tag tag-neutral">{venue.type}</span>
            <span className="tag tag-neutral">{venue.capacity}</span>
            <span className="tag tag-outline">{venue.visibility}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a className="btn btn-primary min-h-11" href={venue.mapUrl} target="_blank" rel="noopener">
            <Icon name="map-pin-line" />
            Cómo llegar
          </a>
          {hasSite && (
            <a className="btn btn-secondary min-h-11" href={venue.site} target="_blank" rel="noopener">
              <Icon name="globe" />
              Sitio web
            </a>
          )}
        </div>
      </div>
      {venue.management && <div className="text-sm text-neutral-700 mt-2">Administración: {venue.management}</div>}

      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-8 pt-8">
        <div className="min-w-0">
          <h6 className="mb-3">Ficha técnica del inmueble</h6>
          {venue.specs.length === 0 ? (
            <p className="text-sm text-neutral-700">El venue todavía no tiene ficha técnica cargada.</p>
          ) : (
          <table className="table">
            <tbody>
              {venue.specs.map((sp, i) => (
                <tr key={i}>
                  <td className="w-[38%] text-neutral-700">{sp.k}</td>
                  <td>{sp.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          )}

          <div className="pt-8">
            <h6 className="mb-3">Contactos del lugar</h6>
            {venue.contacts.length === 0 && (
              <p className="text-sm text-neutral-700">Sin contactos del venue registrados para esta gira.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              {venue.contacts.map((ct, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-base">{ct.name}</div>
                    <div className="text-xs tracking-[0.06em] uppercase text-neutral-700">{ct.role}</div>
                    <div className="text-[13px] mt-0.5 break-words">{ct.email}</div>
                  </div>
                  <a className="btn btn-secondary btn-icon w-10 h-10" href={ct.tel} aria-label={`Llamar a ${ct.name}`}>
                    <Icon name="phone" size={17} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {venue.providerRule && (
            <div className="pt-8">
              <h6 className="mb-2">Proveedores del recinto</h6>
              <p className="text-[15px] text-neutral-700 mb-2 max-w-[60ch]">{venue.providerRule}</p>
              <Link className="btn btn-ghost pl-0 text-sm" href={`/tour/${dateId}/club`}>
                Ver proveedores
              </Link>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h6 className="m-0 mr-auto">Archivos del lugar</h6>
            <span className="text-xs text-neutral-700">{filesMeta}</span>
          </div>
          {venueFiles.length === 0 && <p className="text-sm text-neutral-700 mb-2">El venue no tiene archivos cargados.</p>}
          <FileList files={venueFiles} />
          <UploadButton live={live} label="Subir documento del lugar" onUpload={() => addVenueFile(dateId)} />

          <div className="pt-6">
            <h6 className="mb-1">Notas del lugar</h6>
            <p className="text-xs text-neutral-700 mb-2">
              Lo que conviene saber del inmueble (accesos, elevadores, curfew). Se ven en todas las fechas en este venue.
            </p>
            {venueNotes.length === 0 && <p className="text-sm text-neutral-700">Todavía no hay notas.</p>}
            {venueNotes.map((n, i) => (
              <div key={i} className="py-2">
                <div className="text-sm leading-[1.5]">{n.body}</div>
                <div className="text-xs text-neutral-700 mt-0.5">{n.meta}</div>
              </div>
            ))}
            <form
              className="flex gap-2 mt-2"
              onSubmit={(e) => {
                e.preventDefault();
                addVenueNote(dateId);
              }}
            >
              <input
                className="input min-h-[42px]"
                type="text"
                placeholder="Ej. el elevador de carga mide 1.90 m"
                aria-label="Nueva nota del lugar"
                value={venueNoteDraft}
                onChange={(e) => setVenueNoteDraft(e.target.value)}
              />
              <button type="submit" className="btn btn-primary min-h-[42px] min-w-[42px]" aria-label="Agregar nota">
                <Icon name="plus" size={17} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

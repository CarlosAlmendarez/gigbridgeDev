"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { mapFiles } from "@gigbridge/data";
import type { TourDate } from "@gigbridge/types";

export function LugarView({ dateId, tourDate: d }: { dateId: string; tourDate: TourDate }) {
  const venue = d.venue;
  const {
    extraVenueFiles,
    extraVenueNotes,
    venueNoteDraft,
    setVenueNoteDraft,
    addVenueNote,
    addVenueFile,
  } = useTourUI();

  const venueFiles = mapFiles(venue.files.concat(extraVenueFiles[dateId] || []));
  const venueNotes = (extraVenueNotes[dateId] || []).concat(venue.notes);
  const filesMeta = `${venue.files.length + (extraVenueFiles[dateId] || []).length} archivos`;

  return (
    <div className="pt-6">
      <div className="flex items-end gap-6 flex-wrap">
        <div className="flex-[1_1_360px] min-w-[320px]">
          <div className="text-xs tracking-[0.1em] uppercase text-neutral-700">{venue.kicker}</div>
          <h1 className="text-[48px] my-1 mb-2 tracking-[-0.03em]">{venue.name}</h1>
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
            Mapas
          </a>
          <a className="btn btn-secondary min-h-11" href={venue.site} target="_blank" rel="noopener">
            <Icon name="globe" />
            Sitio
          </a>
        </div>
      </div>
      <div className="text-sm text-neutral-700 mt-2">{venue.management}</div>

      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-8 pt-8">
        <div className="min-w-0">
          <h6 className="mb-3">Ficha técnica del inmueble</h6>
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

          <div className="pt-8">
            <h6 className="mb-3">Contactos del lugar</h6>
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              {venue.contacts.map((ct, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-base">{ct.name}</div>
                    <div className="text-xs tracking-[0.06em] uppercase text-neutral-700">{ct.role}</div>
                    <div className="text-[13px] mt-0.5 break-words">{ct.email}</div>
                  </div>
                  <a className="btn btn-secondary btn-icon w-10 h-10" href={ct.tel} aria-label="Llamar">
                    <Icon name="phone" size={17} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8">
            <h6 className="mb-2">Proveedores del recinto</h6>
            <p className="text-[15px] text-neutral-700 mb-2 max-w-[60ch]">{venue.providerRule}</p>
            <Link className="btn btn-ghost pl-0 text-sm" href={`/tour/${dateId}/club`}>
              Ver el Club de proveedores
            </Link>
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h6 className="m-0 mr-auto">Archivos del lugar</h6>
            <span className="text-xs text-neutral-700">{filesMeta}</span>
          </div>
          {venueFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Icon name={f.icon} size={23} className="text-accent-700" />
              <div className="flex-1 min-w-0">
                <div className="font-heading font-semibold text-[15px] break-words">{f.name}</div>
                <div className="text-xs text-neutral-700">{f.meta}</div>
              </div>
              <span className={f.tagClass}>{f.tagLabel}</span>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-block min-h-[42px]"
            onClick={() => addVenueFile(dateId)}
          >
            <Icon name="upload-simple" size={17} />
            Subir documento del lugar
          </button>

          <div className="pt-6">
            <h6 className="mb-2">Notas del lugar</h6>
            {venueNotes.map((n, i) => (
              <div key={i} className="py-2">
                <div className="text-sm leading-[1.5]">{n.body}</div>
                <div className="text-xs text-neutral-700 mt-0.5">{n.meta}</div>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                className="input min-h-[42px]"
                type="text"
                placeholder="Nota sobre el inmueble"
                value={venueNoteDraft}
                onChange={(e) => setVenueNoteDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary min-h-[42px] min-w-[42px]"
                onClick={() => addVenueNote(dateId)}
                aria-label="Agregar nota"
              >
                <Icon name="plus" size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

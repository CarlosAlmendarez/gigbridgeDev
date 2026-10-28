"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";

export function RiderView({ dateId }: { dateId: string }) {
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
        Día de show
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

"use client";

import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { mapFiles } from "@gigbridge/data";
import type { TourDate } from "@gigbridge/types";

export function ShowView({ dateId, tourDate: d }: { dateId: string; tourDate: TourDate }) {
  const {
    setlist,
    moveSetlist,
    extraShowFiles,
    extraShowNotes,
    showNoteDraft,
    setShowNoteDraft,
    addShowNote,
    addShowFile,
  } = useTourUI();

  const showFiles = mapFiles(d.show.docs.concat(extraShowFiles[dateId] || []));
  const showNotes = (extraShowNotes[dateId] || []).concat(d.show.notes);
  const docsMeta = `${d.show.docs.length + (extraShowFiles[dateId] || []).length} documentos`;

  return (
    <div className="pt-6">
      <div className="text-xs tracking-[0.1em] uppercase text-neutral-700">{d.show.kicker}</div>
      <h1 className="text-[48px] my-1 mb-4 tracking-[-0.03em]">Ficha del show</h1>
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 max-w-[760px]">
        {d.show.headline.map((h, i) => (
          <div key={i}>
            <div className="font-heading font-semibold text-[34px] leading-none tabular-nums">{h.value}</div>
            <div className="text-[13px] text-neutral-700 mt-1">{h.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-8 pt-8">
        <div className="min-w-0">
          <h6 className="mb-3">Horarios de montaje</h6>
          <table className="table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Actividad</th>
                <th>Área</th>
              </tr>
            </thead>
            <tbody>
              {d.show.montaje.map((m, i) => (
                <tr key={i}>
                  <td className="tabular-nums whitespace-nowrap">{m.time}</td>
                  <td>{m.task}</td>
                  <td className="text-neutral-700">{m.area}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-8">
            <div className="flex items-baseline gap-2 mb-3">
              <h6 className="m-0 mr-auto">Setlist de la fecha</h6>
              <span className="text-xs text-neutral-700">{setlist.length} canciones · editable</span>
            </div>
            {setlist.map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-[5px]">
                <span className="w-[26px] tabular-nums text-[13px] text-neutral-700">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-base">{s.title}</div>
                  <div className="text-xs text-neutral-700">{s.cue}</div>
                </div>
                <span className="flex-none text-xs text-neutral-700 tabular-nums">{s.len}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon flex-none w-9 h-9"
                  onClick={() => moveSetlist(i, -1)}
                  aria-label="Subir"
                >
                  <Icon name="arrow-up" size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon flex-none w-9 h-9"
                  onClick={() => moveSetlist(i, 1)}
                  aria-label="Bajar"
                >
                  <Icon name="arrow-down" size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h6 className="m-0 mr-auto">Documentos técnicos</h6>
            <span className="text-xs text-neutral-700">{docsMeta}</span>
          </div>
          {showFiles.map((f, i) => (
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
            onClick={() => addShowFile(dateId)}
          >
            <Icon name="upload-simple" size={17} />
            Subir documento del show
          </button>

          <div className="pt-6">
            <h6 className="mb-2">Notas de este show</h6>
            {showNotes.map((n, i) => (
              <div key={i} className="py-2">
                <div className="text-sm leading-[1.5]">{n.body}</div>
                <div className="text-xs text-neutral-700 mt-0.5">{n.meta}</div>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                className="input min-h-[42px]"
                type="text"
                placeholder="Cambio de setlist, escenario, cueing…"
                value={showNoteDraft}
                onChange={(e) => setShowNoteDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary min-h-[42px] min-w-[42px]"
                onClick={() => addShowNote(dateId)}
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

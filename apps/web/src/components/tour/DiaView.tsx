"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { REMINDER_PRESETS, buildGroups, fileTag } from "@gigbridge/data";
import { chipClass } from "@/lib/ui";
import type { RosterPerson, TourDate } from "@gigbridge/types";

export function DiaView({ dateId, tourDate: d, roster }: { dateId: string; tourDate: TourDate; roster: RosterPerson[] }) {
  const {
    source,
    lens,
    clockDone,
    toggleClock,
    vehicles,
    moveVehicle,
    reminders,
    dismissReminder,
    addReminder,
    notas,
    notaDraft,
    setNotaDraft,
    addNota,
    adopted: adoptedState,
  } = useTourUI();
  const live = source === "supabase";
  // Un día de viaje sin datos de ruta no tiene ficha del lugar que ver.
  const isTravel = d.kind === "Viaje" && d.venue.specs.length === 0;

  const clockKey = (time: string, label: string) => `${dateId}|${time}|${label}`;
  const hechos = d.clock.filter((c) => clockDone[clockKey(c.time, c.label)]).length;

  const lensedRoster = lens === "Todos" ? roster : roster.filter((p) => p.party === lens);
  const lensedOnSite = buildGroups(
    lensedRoster.filter((p) => p.onSite),
    [],
    "equipo"
  );
  const crewTodayTitle =
    (live ? "Equipo confirmado" : "Equipos en sitio") + (lens === "Todos" ? "" : ` · Party ${lens}`);

  const barColor = d.completion >= 80 ? "bg-accent" : "bg-accent-2";

  return (
    <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))] gap-8 pt-6">
      <div className="min-w-0">
        <div className="text-xs tracking-[0.1em] uppercase text-neutral-700">{d.kicker}</div>
        <h1 className="text-[40px] sm:text-[52px] my-1 mb-2 tracking-[-0.03em]">{d.title}</h1>
        <div className="text-base leading-[1.55] whitespace-pre-line max-w-[46ch]">{d.subtitle}</div>
        <div className="flex flex-wrap gap-2 mt-4">
          <a className="btn btn-primary min-h-11" href={d.mapUrl} target="_blank" rel="noopener">
            <Icon name="map-pin-line" />
            Cómo llegar
          </a>
          {d.tel && (
            <a className="btn btn-secondary min-h-11" href={d.tel}>
              <Icon name="phone-call" />
              Llamar a {d.telLabel || "producción"}
            </a>
          )}
          {!isTravel && (
            <Link className="btn btn-secondary min-h-11" href={`/tour/${dateId}/lugar`}>
              <Icon name="map-trifold" />
              Ficha del lugar
            </Link>
          )}
          <Link className="btn btn-secondary min-h-11" href={`/tour/${dateId}/show`}>
            <Icon name="microphone-stage" />
            Ficha del show
          </Link>
        </div>
        {d.contactLine && <div className="text-[13px] text-neutral-700 mt-2">{d.contactLine}</div>}

        <div className="pt-8">
          <div className="flex items-baseline gap-2 mb-1">
            <h6 className="m-0 mr-auto">Reloj del día</h6>
            {d.clock.length > 0 && (
              <span className="text-xs text-neutral-700 tabular-nums">
                {hechos} de {d.clock.length} cumplidos
              </span>
            )}
          </div>
          {d.clock.length > 0 ? (
            <>
              <p className="text-xs text-neutral-700 mb-3">
                Toca un horario para marcarlo como cumplido. La marca solo se guarda en este dispositivo.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4">
                {d.clock.map((c) => {
                  const key = clockKey(c.time, c.label);
                  const done = Boolean(clockDone[key]);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleClock(key)}
                      aria-pressed={done}
                      className="text-left border-0 bg-transparent p-0 cursor-pointer font-body"
                    >
                      <div
                        className={
                          "font-heading font-semibold text-[clamp(30px,3.2vw,40px)] leading-none tabular-nums" +
                          (c.accent ? " text-accent-700" : " text-text") +
                          (done ? " line-through opacity-55" : "")
                        }
                      >
                        {c.time}
                      </div>
                      <div className="text-[13px] text-neutral-700 mt-1 flex items-center gap-1">
                        <Icon name={done ? "check-circle" : "circle-dashed"} size={14} className={done ? "text-accent" : ""} />
                        {c.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-700">Sin horarios cargados para esta fecha.</p>
          )}
          {d.clockNote && <div className="text-[15px] italic mt-4">{d.clockNote}</div>}
        </div>

        {vehicles.length > 0 && (
          <div className="pt-8 max-w-[520px]">
            <h6 className="mb-1">Orden de carga</h6>
            <p className="text-xs text-neutral-700 mb-3">
              Orden en que los vehículos entran a descargar al venue.
              {live ? " Solo los admins de la gira pueden cambiarlo." : ""}
            </p>
            {vehicles.map((v, i) => (
              <div key={v.id ?? i} className="flex items-center gap-2 py-1">
                <span className="w-6 tabular-nums font-heading font-semibold text-[17px]">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-[15px] text-pretty">{v.label}</div>
                  {v.meta && <div className="text-xs text-neutral-700 text-pretty">{v.meta}</div>}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon flex-none w-9 h-9 disabled:opacity-40"
                  onClick={() => moveVehicle(i, -1)}
                  disabled={i === 0}
                  aria-label={`Subir ${v.label}`}
                >
                  <Icon name="arrow-up" size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon flex-none w-9 h-9 disabled:opacity-40"
                  onClick={() => moveVehicle(i, 1)}
                  disabled={i === vehicles.length - 1}
                  aria-label={`Bajar ${v.label}`}
                >
                  <Icon name="arrow-down" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {lensedOnSite.length > 0 && (
          <div className="pt-8">
            <div className="flex items-baseline gap-2 mb-3">
              <h6 className="m-0 mr-auto">{crewTodayTitle}</h6>
              <Link className="btn btn-ghost text-[13px]" href={`/tour/${dateId}/equipo/crew`}>
                Ver todo el equipo
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2 gap-x-6">
              {lensedOnSite.map((g) => (
                <div key={g.key} className="flex items-center gap-3 py-[5px]">
                  <Icon name={g.icon} size={21} className="text-accent-700" />
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-[15px]">{g.name}</div>
                    <div className="text-xs text-neutral-700 overflow-hidden text-ellipsis whitespace-nowrap">
                      {g.people.map((p) => p.name.split(" ")[0]).join(" · ")}
                    </div>
                  </div>
                  <span className="tag tag-neutral">{g.people.length}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.itinerary.length > 0 && (
          <div className="pt-8">
            <h6 className="mb-3">Itinerario de viaje</h6>
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 gap-x-6">
              {d.itinerary.map((it, i) => (
                <div key={i} className="flex gap-3">
                  <Icon name={it.icon} size={21} className="text-accent-700" />
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-base">{it.title}</div>
                    <div className="text-[13px] text-neutral-700">{it.meta}</div>
                    <div className="text-[13px] italic mt-[3px]">{it.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h6 className="m-0 mr-auto">Qué falta</h6>
            <span className="text-xs text-neutral-700 tabular-nums">{d.completion}% listo</span>
          </div>
          <div
            className="h-[3px] bg-neutral-300 rounded-sm"
            role="progressbar"
            aria-valuenow={d.completion}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avance de la fecha"
          >
            <div className={"h-[3px] rounded-sm " + barColor} style={{ width: `${d.completion}%` }} />
          </div>
          {d.missing.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-3">
              {d.missing.map((m, i) => (
                <span key={i} className="tag tag-accent-2">
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-700 mt-3">Nada pendiente para esta fecha.</p>
          )}
        </div>

        <div className="pt-6">
          <h6 className="mb-2">Hospedaje</h6>
          {d.hotel ? (
            <>
              <div className="font-heading font-semibold text-xl">{d.hotel}</div>
              {d.hotelMeta && <div className="text-sm mt-[3px]">{d.hotelMeta}</div>}
            </>
          ) : (
            <p className="text-sm text-neutral-700">Sin hospedaje cargado para esta fecha.</p>
          )}
          <div className="flex gap-2 mt-3">
            {d.hotelMap && (
              <a className="btn btn-secondary min-h-10" href={d.hotelMap} target="_blank" rel="noopener">
                <Icon name="navigation-arrow" size={17} />
                Ruta al hotel
              </a>
            )}
            <Link className="btn btn-secondary min-h-10" href={`/tour/${dateId}/equipo/ubicaciones`}>
              <Icon name="bed" size={17} />
              Quién duerme dónde
            </Link>
          </div>
          <div className="flex items-start gap-2 mt-3 text-[13px] text-neutral-700">
            <Icon name="lock-key" size={17} className="text-accent-2-700" />
            <span>
              {live
                ? "Cada quien ve su propio cuarto. Los demás números solo aparecen si tienes permiso de verlos."
                : "Número de cuarto oculto: solo lo ve el Personal Manager y quien él autorice."}
            </span>
          </div>
        </div>

        {live ? <LiveDocsCard dateId={dateId} d={d} /> : <PrototypeRiderCards dateId={dateId} d={d} adoptedState={adoptedState} />}

        {!live && (
          <div className="pt-6">
            <h6 className="mb-2">Mis recordatorios</h6>
            {reminders.map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-[5px]">
                <Icon name="alarm" size={19} className="text-accent-700" />
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-[15px] tabular-nums">{r.at}</div>
                  <div className="text-[13px] text-neutral-700">{r.message}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon w-9 h-9"
                  onClick={() => dismissReminder(i)}
                  aria-label={`Quitar recordatorio de las ${r.at}`}
                >
                  <Icon name="x" size={15} />
                </button>
              </div>
            ))}
            <div className="flex flex-wrap gap-1 mt-2">
              {REMINDER_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => addReminder({ at: p.at, message: p.message })}
                  className={chipClass(false, true)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6">
          <h6 className="mb-1">Notas de la gira</h6>
          <p className="text-xs text-neutral-700 mb-2">
            Avisos para todo el equipo. Lo que escribas aquí queda ligado a esta fecha.
          </p>
          {notas.length === 0 && <p className="text-sm text-neutral-700">Todavía no hay notas.</p>}
          {notas.map((n, i) => (
            <div key={i} className="py-2">
              <span className="tag tag-neutral">{n.origen}</span>
              <div className="text-sm leading-[1.5] mt-[5px]">{n.body}</div>
              <div className="text-xs text-neutral-700 mt-0.5">{n.meta}</div>
            </div>
          ))}
          <form
            className="flex gap-2 mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              addNota(`Fecha · ${d.dateline.replace(/ \d{4}$/, "")}`, dateId);
            }}
          >
            <input
              className="input min-h-[42px]"
              type="text"
              placeholder="Escribe un aviso para el equipo"
              aria-label="Nueva nota de la gira"
              value={notaDraft}
              onChange={(e) => setNotaDraft(e.target.value)}
            />
            <button type="submit" className="btn btn-primary min-h-[42px] min-w-[42px]" aria-label="Publicar nota">
              <Icon name="paper-plane-tilt" size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/** Con datos reales: documentos de la fecha y su vigencia (referencia en vivo, 0007). */
function LiveDocsCard({ dateId, d }: { dateId: string; d: TourDate }) {
  const toReview = d.show.docs.filter((f) => f.status === "revisar").length;
  return (
    <div className="pt-6 flex flex-col gap-2">
      <h6 className="m-0">Documentos de la fecha</h6>
      <div className="card elev-sm">
        {d.show.docs.length === 0 ? (
          <p className="card-body">Esta fecha todavía no tiene documentos ligados (rider, plano, patch list…).</p>
        ) : (
          <>
            {toReview > 0 && (
              <p className="card-body">
                {toReview === 1 ? "1 documento tiene" : `${toReview} documentos tienen`} una versión más nueva que la
                que usa esta fecha.
              </p>
            )}
            <div className="flex flex-col gap-1">
              {d.show.docs.slice(0, 4).map((f, i) => {
                const [tagClass, tagLabel] = fileTag(f.status);
                return (
                  <div key={f.documentId ?? i} className="flex items-center gap-2">
                    <span className="flex-1 min-w-0 text-sm break-words">{f.name}</span>
                    <span className={tagClass}>{tagLabel}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <Link className="btn btn-primary min-h-10" href={`/tour/${dateId}/rider`}>
          <Icon name="file-pdf" size={17} />
          Documentos y versiones
        </Link>
      </div>
      {d.kind !== "Viaje" && (
        <div className="card elev-sm">
          <span className="card-kicker">Expediente del venue</span>
          <div className="card-title">{d.venueRider}</div>
          {d.venueRiderNote && <p className="card-body">{d.venueRiderNote}</p>}
          <div className="card-meta">
            <Icon name="check-circle" size={15} />
            <span>{d.advanceLine}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Gira de ejemplo: las tarjetas del prototipo de Claude Design, tal cual. */
function PrototypeRiderCards({ dateId, d, adoptedState }: { dateId: string; d: TourDate; adoptedState: boolean | null }) {
  const adopted = adoptedState ?? false;
  return (
    <div className="pt-6 flex flex-col gap-2">
      <h6 className="m-0">Riders</h6>
      <div className="card elev-sm">
        <div className="flex items-center gap-2">
          <span className="card-kicker mr-auto">Rider técnico · banda</span>
          <span className={adopted ? "tag tag-accent" : "tag tag-accent-2"}>{adopted ? "v4 vigente" : "v3 desactualizado"}</span>
        </div>
        <div className="card-title">{adopted ? "v4 en uso en esta fecha" : "v3 en uso en esta fecha"}</div>
        <p className="card-body">
          {adopted
            ? "Esta fecha ya usa la versión vigente. El input list de 32 canales es el que tiene el Patch Master."
            : "La banda publicó la v4 el 8 sep, después del avance. El Patch Master del foro sigue con la v3 de 30 canales."}
        </p>
        <div className="card-meta">
          <Icon name="clock-counter-clockwise" size={15} />
          <span>{adopted ? "Actualizada hoy" : "v4 publicada hace 4 días"}</span>
        </div>
        <Link className="btn btn-primary min-h-10" href={`/tour/${dateId}/rider`}>
          <Icon name="file-pdf" size={17} />
          Ver versiones
        </Link>
      </div>
      <div className="card elev-sm">
        <div className="flex items-center gap-2">
          <span className="card-kicker mr-auto">Rider del venue</span>
          <span className="tag tag-accent">v2 vigente</span>
        </div>
        <div className="card-title">{d.venueRider}</div>
        <p className="card-body">{d.venueRiderNote}</p>
        <div className="card-meta">
          <Icon name="check-circle" size={15} />
          <span>{d.advanceLine}</span>
        </div>
      </div>
    </div>
  );
}

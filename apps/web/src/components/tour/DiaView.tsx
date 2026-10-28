"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { REMINDER_PRESETS, buildGroups } from "@gigbridge/data";
import { chipClass } from "@/lib/ui";
import type { RosterPerson, TourDate } from "@gigbridge/types";

export function DiaView({ dateId, tourDate: d, roster }: { dateId: string; tourDate: TourDate; roster: RosterPerson[] }) {
  const {
    lens,
    hitos,
    toggleHito,
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

  const stale = true; // riderDesactualizado default from the design's props panel
  const adopted = adoptedState === null ? !stale : adoptedState;
  const verCuarto = false; // mostrarCuartoHotel default

  const hechos = hitos.filter((h) => h.done).length;

  const lensedRoster = lens === "Todos" ? roster : roster.filter((p) => p.party === lens);
  const lensedOnSite = buildGroups(
    lensedRoster.filter((p) => p.onSite),
    [],
    "equipo"
  );

  const crewTodayTitle = lens === "Todos" ? "Equipos en sitio hoy" : `Party ${lens} en sitio hoy`;

  const roomLine = verCuarto
    ? "Cuarto 512 — lo ves porque eres Tour Manager de esta gira."
    : "Número de cuarto oculto: solo lo ve el Personal Manager y quien él autorice.";

  const riderTagClass = adopted ? "tag tag-accent" : "tag tag-accent-2";
  const riderTagLabel = adopted ? "v4 vigente" : "v3 desactualizado";
  const riderInUse = adopted ? "v4 en uso en esta fecha" : "v3 en uso en esta fecha";
  const riderNote = adopted
    ? "Esta fecha ya usa la versión vigente. El input list de 32 canales es el que tiene el Patch Master."
    : "La banda publicó la v4 el 8 sep, después del avance. El Patch Master del foro sigue con la v3 de 30 canales.";
  const riderUpdated = adopted ? "Actualizada hoy" : "v4 publicada hace 4 días";

  const barColor = d.completion >= 80 ? "bg-accent" : "bg-accent-2";

  return (
    <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))] gap-8 pt-6">
      <div className="min-w-0">
        <div className="text-xs tracking-[0.1em] uppercase text-neutral-700">{d.kicker}</div>
        <h1 className="text-[52px] my-1 mb-2 tracking-[-0.03em]">{d.title}</h1>
        <div className="text-base leading-[1.55] whitespace-pre-line max-w-[46ch]">{d.subtitle}</div>
        <div className="flex flex-wrap gap-2 mt-4">
          <a className="btn btn-primary min-h-11" href={d.mapUrl} target="_blank" rel="noopener">
            <Icon name="map-pin-line" />
            Cómo llegar
          </a>
          <a className="btn btn-secondary min-h-11" href={d.tel}>
            <Icon name="phone-call" />
            {d.telLabel}
          </a>
          <Link className="btn btn-secondary min-h-11" href={`/tour/${dateId}/lugar`}>
            <Icon name="map-trifold" />
            Ficha del lugar
          </Link>
          <Link className="btn btn-secondary min-h-11" href={`/tour/${dateId}/show`}>
            <Icon name="microphone-stage" />
            Ficha del show
          </Link>
        </div>
        <div className="text-[13px] text-neutral-700 mt-2">{d.contactLine}</div>

        <div className="pt-8">
          <h6 className="mb-3">Reloj del día</h6>
          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4">
            {d.clock.map((c, i) => (
              <div key={i}>
                <div
                  className={
                    "font-heading font-semibold text-[clamp(30px,3.2vw,40px)] leading-none tabular-nums" +
                    (c.accent ? " text-accent-700" : "")
                  }
                >
                  {c.time}
                </div>
                <div className="text-[13px] text-neutral-700 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="text-[15px] italic mt-4">{d.clockNote}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 gap-x-8 pt-8">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 mb-3">
              <h6 className="m-0 mr-auto">Hitos del día</h6>
              <span className="text-xs text-neutral-700 tabular-nums">
                {hechos} de {hitos.length} cumplidos
              </span>
            </div>
            {hitos.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => toggleHito(h.id)}
                className="flex items-center gap-3 w-full min-h-11 py-[5px] border-0 bg-transparent cursor-pointer text-left font-body"
              >
                <span className={"inline-flex " + (h.done ? "text-accent" : "text-neutral-500")}>
                  <Icon name={h.done ? "check-circle" : "circle-dashed"} size={19} />
                </span>
                <span
                  className={
                    "flex-1 min-w-0 font-heading font-semibold text-base text-text" +
                    (h.done ? " line-through opacity-55" : "")
                  }
                >
                  {h.label}
                </span>
                <span className="text-sm tabular-nums text-neutral-700">{h.time}</span>
              </button>
            ))}
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 mb-3">
              <h6 className="m-0 mr-auto">Orden de carga</h6>
              <span className="text-xs text-neutral-700">Dockmaster</span>
            </div>
            {vehicles.map((v, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <span className="w-6 tabular-nums font-heading font-semibold text-[17px]">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-[15px] text-pretty">{v.label}</div>
                  <div className="text-xs text-neutral-700 text-pretty">{v.meta}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon flex-none w-9 h-9"
                  onClick={() => moveVehicle(i, -1)}
                  aria-label="Subir"
                >
                  <Icon name="arrow-up" size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon flex-none w-9 h-9"
                  onClick={() => moveVehicle(i, 1)}
                  aria-label="Bajar"
                >
                  <Icon name="arrow-down" size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8">
          <div className="flex items-baseline gap-2 mb-3">
            <h6 className="m-0 mr-auto">{crewTodayTitle}</h6>
            <Link className="btn btn-ghost text-[13px]" href={`/tour/${dateId}/equipo/crew`}>
              Ver equipo
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
      </div>

      <div>
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h6 className="m-0 mr-auto">Qué falta</h6>
            <span className="text-xs text-neutral-700 tabular-nums">{d.completion}% listo</span>
          </div>
          <div className="h-[3px] bg-neutral-300 rounded-sm">
            <div className={"h-[3px] rounded-sm " + barColor} style={{ width: `${d.completion}%` }} />
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {d.missing.map((m, i) => (
              <span key={i} className="tag tag-accent-2">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <h6 className="mb-2">Hospedaje</h6>
          <div className="font-heading font-semibold text-xl">{d.hotel}</div>
          <div className="text-sm mt-[3px]">{d.hotelMeta}</div>
          <div className="flex gap-2 mt-3">
            <a className="btn btn-secondary min-h-10" href={d.hotelMap} target="_blank" rel="noopener">
              <Icon name="navigation-arrow" size={17} />
              Ruta
            </a>
            <Link className="btn btn-secondary min-h-10" href={`/tour/${dateId}/equipo/ubicaciones`}>
              <Icon name="bed" size={17} />
              Ubicaciones
            </Link>
          </div>
          <div className="flex items-start gap-2 mt-3 text-[13px] text-neutral-700">
            <Icon name="lock-key" size={17} className="text-accent-2-700" />
            <span>{roomLine}</span>
          </div>
        </div>

        <div className="pt-6 flex flex-col gap-2">
          <h6 className="m-0">Riders</h6>
          <div className="card elev-sm">
            <div className="flex items-center gap-2">
              <span className="card-kicker mr-auto">Rider técnico · banda</span>
              <span className={riderTagClass}>{riderTagLabel}</span>
            </div>
            <div className="card-title">{riderInUse}</div>
            <p className="card-body">{riderNote}</p>
            <div className="card-meta">
              <Icon name="clock-counter-clockwise" size={15} />
              <span>{riderUpdated}</span>
            </div>
            <div className="flex gap-2">
              <Link className="btn btn-primary flex-1 min-h-10" href={`/tour/${dateId}/rider`}>
                <Icon name="file-pdf" size={17} />
                Ver vigente
              </Link>
              <Link className="btn btn-secondary min-h-10" href={`/tour/${dateId}/rider`}>
                Versiones
              </Link>
            </div>
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
                aria-label="Quitar"
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

        <div className="pt-6">
          <h6 className="mb-2">Notas de la gira</h6>
          {notas.map((n, i) => (
            <div key={i} className="py-2">
              <span className="tag tag-neutral">{n.origen}</span>
              <div className="text-sm leading-[1.5] mt-[5px]">{n.body}</div>
              <div className="text-xs text-neutral-700 mt-0.5">{n.meta}</div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              className="input min-h-[42px]"
              type="text"
              placeholder="Nota para el crew"
              value={notaDraft}
              onChange={(e) => setNotaDraft(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary min-h-[42px] min-w-[42px]"
              onClick={() => addNota(`Fecha · ${d.dow} ${d.day} sep`)}
              aria-label="Enviar nota"
            >
              <Icon name="paper-plane-tilt" size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

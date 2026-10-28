"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { CONTACT_TYPES, EQUIPO_TABS, GROUP_MODES, PARTIES } from "@gigbridge/config";
import { buildGroups, guestTag } from "@gigbridge/data";
import { chipClass } from "@/lib/ui";
import type { EquipoTabId, ExternalContact, RosterPerson, TourDate, Vacancy } from "@gigbridge/types";

export function EquipoView({
  dateId,
  tab,
  roster: ROSTER,
  vacancies: VACANCIES,
  externalContacts: EXTERNAL_CONTACTS,
  dates: DATES,
}: {
  dateId: string;
  tab: EquipoTabId;
  roster: RosterPerson[];
  vacancies: Vacancy[];
  externalContacts: ExternalContact[];
  dates: TourDate[];
}) {
  const {
    lens,
    groupBy,
    setGroupBy,
    accountFilter,
    setAccountFilter,
    contactType,
    setContactType,
    groupOpen,
    toggleGroupOpen,
    crewSel,
    setCrewSel,
    guestsByDate,
    guestDraft,
    setGuestDraft,
    addGuest,
    cycleGuestStatus,
  } = useTourUI();

  const eq = EQUIPO_TABS.find((t) => t.id === tab) ?? EQUIPO_TABS[0];
  const lensed = lens === "Todos" ? ROSTER : ROSTER.filter((p) => p.party === lens);
  const lensedVac = lens === "Todos" ? VACANCIES : VACANCIES.filter((v) => v.party === lens);
  const modeDef = GROUP_MODES.find((m) => m.id === groupBy) ?? GROUP_MODES[0];

  const groupsRaw = buildGroups(lensed, lensedVac, groupBy);
  const crewRoster = lensed.filter(
    (p) => accountFilter === "Todos" || (accountFilter === "Con cuenta" ? p.account : !p.account)
  );
  const crewGroupsRaw = buildGroups(crewRoster, lensedVac, groupBy);

  const lensName = lens === "Todos" ? "Norte 2026 · toda la gira" : `Norte 2026 · ${PARTIES[lens].name}`;
  const equipoTitle = eq.title;
  const showGroupModes = ["crew", "areas", "ubicaciones"].includes(tab);
  const equipoHelp = showGroupModes ? modeDef.help : eq.help;

  const crewDetail = (() => {
    const c = ROSTER.find((x) => x.name === crewSel) ?? ROSTER[0];
    return c;
  })();

  return (
    <div className="pt-6">
      <div className="flex items-end gap-6 flex-wrap">
        <div className="flex-[1_1_360px] min-w-[320px]">
          <div className="text-xs tracking-[0.1em] uppercase text-neutral-700">{lensName}</div>
          <h1 className="text-[48px] my-1 mb-2 tracking-[-0.03em]">{equipoTitle}</h1>
          <p className="text-base m-0 max-w-[56ch] text-pretty">{equipoHelp}</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {EQUIPO_TABS.map((t) => (
            <Link key={t.id} href={`/tour/${dateId}/equipo/${t.id}`} className={chipClass(tab === t.id)}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex gap-1 flex-wrap pt-4 pb-6">
        {showGroupModes &&
          GROUP_MODES.map((g) => (
            <button key={g.id} type="button" onClick={() => setGroupBy(g.id)} className={chipClass(groupBy === g.id, true)}>
              {g.label}
            </button>
          ))}
        {tab === "crew" &&
          (["Todos", "Con cuenta", "Freelance"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setAccountFilter(f)} className={chipClass(accountFilter === f, true)}>
              {f}
            </button>
          ))}
        {tab === "contactos" &&
          CONTACT_TYPES.map((f) => (
            <button key={f} type="button" onClick={() => setContactType(f)} className={chipClass(contactType === f, true)}>
              {f}
            </button>
          ))}
      </div>

      {tab === "crew" && (
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 gap-x-6 items-start">
          {crewGroupsRaw
            .filter((g) => g.people.length)
            .map((g) => (
              <div key={g.key}>
                <div className="flex items-baseline gap-2">
                  <Icon name={g.icon} size={20} className="text-accent-700" />
                  <div className="font-heading font-semibold text-[19px] mr-auto">{g.name}</div>
                  <span className="text-xs text-neutral-700 tabular-nums">
                    {g.people.length}
                    {g.vacancies.length ? ` · ${g.vacancies.length} vacantes` : ""}
                  </span>
                </div>
                <div className="text-[13px] text-neutral-700 mt-0.5">{g.subtitle}</div>
                <div className="flex flex-col pt-2">
                  {g.people.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCrewSel(c.name)}
                      className="flex items-center gap-2 w-full min-h-12 py-1 border-0 bg-transparent cursor-pointer text-left font-body"
                      style={groupBy === "jerarquia" ? { paddingLeft: c.depth * 18 } : undefined}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-semibold text-base text-text">{c.name}</div>
                        <div className="text-xs tracking-[0.06em] uppercase text-neutral-700">{c.role}</div>
                      </div>
                      <span className={c.account ? "tag tag-accent" : "tag tag-outline"}>
                        {c.account ? "Con cuenta" : "Freelance"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === "areas" && (
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-8 gap-x-6 items-start">
          {groupsRaw.map((g) => {
            const leads = g.people.filter((p) => /Crew Chief|Manager|Jefa|Jefe/.test(p.role));
            const chief = (leads.length ? leads : g.people).slice().sort((a, b) => a.depth - b.depth)[0];
            const n = g.people.length;
            const open = groupOpen === g.key;
            const roles = g.people
              .map((p) => ({
                role: `${p.role} · ${p.team}`,
                person: p.name,
                real: true,
                account: p.account,
              }))
              .concat(
                g.vacancies.map((v) => ({
                  role: `${v.role} · ${v.team}`,
                  person: "Sin asignar",
                  real: false,
                  account: false,
                }))
              );
            return (
              <div key={g.key}>
                <button
                  type="button"
                  onClick={() => toggleGroupOpen(g.key)}
                  className="flex items-start gap-3 w-full border-0 bg-transparent p-0 cursor-pointer text-left"
                >
                  <Icon name={g.icon} size={25} className="text-accent-700" />
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-xl text-text">{g.name}</div>
                    <div className="text-[13px] text-neutral-700">{n === 1 ? "1 persona" : `${n} personas`}</div>
                    <div className="text-[13px] text-accent-700">
                      {chief ? `${modeDef.lead}: ${chief.name}` : "Sin responsable asignado"}
                    </div>
                  </div>
                  <Icon name={open ? "caret-up" : "caret-down"} size={19} className="text-neutral-700" />
                </button>
                {open && (
                  <div className="pt-3 flex flex-col">
                    {roles.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 py-[5px]">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs tracking-[0.06em] uppercase text-neutral-700">{r.role}</div>
                          <div
                            className={
                              "font-heading font-semibold text-base " + (r.real ? "text-text" : "text-neutral-500")
                            }
                          >
                            {r.person}
                          </div>
                        </div>
                        <span className={!r.real ? "tag tag-neutral" : r.account ? "tag tag-accent" : "tag tag-outline"}>
                          {!r.real ? "Vacante" : r.account ? "Con cuenta" : "Freelance"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "ubicaciones" && (
        <div>
          <div className="flex flex-col gap-8">
            {groupsRaw
              .filter((g) => g.people.length)
              .map((g) => (
                <div key={g.key}>
                  <div className="flex items-baseline gap-2">
                    <Icon name={g.icon} size={20} className="text-accent-700" />
                    <div className="font-heading font-semibold text-xl mr-auto">{g.name}</div>
                    <span className="text-xs text-neutral-700 tabular-nums">{g.people.length} personas</span>
                  </div>
                  <table className="table mt-2">
                    <thead>
                      <tr>
                        <th>Persona</th>
                        <th>Rol</th>
                        <th>Hotel</th>
                        <th>Cuarto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.people.map((p) => {
                        const oculto = p.roomScope === "self" || p.roomScope === "custom";
                        const room = p.room === "n/a" ? "No viaja" : oculto ? "Oculto" : p.room;
                        const roomClass = p.room === "n/a" ? "tag tag-neutral" : oculto ? "tag tag-accent-2" : "tag tag-accent";
                        return (
                          <tr key={p.name}>
                            <td className="font-semibold">{p.name}</td>
                            <td className="text-[13px] text-neutral-700">{p.role}</td>
                            <td className="text-[13px]">{p.hotel}</td>
                            <td>
                              <span className={roomClass}>{room}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
          <div className="flex gap-2 items-start text-[13px] text-neutral-700 pt-6">
            <Icon name="lock-key" size={18} className="text-accent-2-700" />
            <span>
              Los cuartos marcados como &quot;Oculto&quot; tienen visibilidad self o custom: se abren con permiso del
              Production Manager.
            </span>
          </div>
        </div>
      )}

      {tab === "contactos" && (
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 items-start">
          {EXTERNAL_CONTACTS.concat(
            lensed.map((p: RosterPerson) => ({
              name: p.name,
              role: `${p.role} · ${p.team}`,
              type: "Gira",
              email: p.email,
              phone: p.tel.replace("+52", "+52 "),
              tel: p.tel,
              note: p.note,
            }))
          )
            .filter((c) => contactType === "Todos" || c.type === contactType)
            .map((c, i) => (
              <div key={i}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-[19px]">{c.name}</div>
                    <div className="text-xs tracking-[0.06em] uppercase text-neutral-700">{c.role}</div>
                  </div>
                  <span
                    className={
                      c.type === "Gira" ? "tag tag-accent" : c.type === "Proveedor" ? "tag tag-neutral" : "tag tag-outline"
                    }
                  >
                    {c.type}
                  </span>
                </div>
                <div className="text-sm mt-2 leading-[1.6] break-words">
                  {c.email}
                  <br />
                  {c.phone}
                </div>
                <div className="text-[13px] italic text-neutral-700 mt-[3px]">{c.note || "Sin notas"}</div>
                <div className="flex gap-2 mt-2">
                  <a className="btn btn-secondary min-h-10" href={`tel:${c.tel.replace(/\s/g, "")}`}>
                    <Icon name="phone" size={17} />
                    Llamar
                  </a>
                  <a className="btn btn-secondary min-h-10" href={`mailto:${c.email}`}>
                    <Icon name="envelope-simple" size={17} />
                    Correo
                  </a>
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === "invitados" && (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-8">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <div className="font-heading font-semibold text-[46px] leading-none tabular-nums">
                {(guestsByDate[dateId] || []).filter((g) => g.status !== "denied").length}
              </div>
              <div className="text-sm text-neutral-700">
                invitados · {(guestsByDate[dateId] || []).filter((g) => g.status === "pending").length} por confirmar
              </div>
            </div>
            <div className="flex gap-2 pt-4 pb-4 max-w-[460px]">
              <input
                className="input min-h-11"
                type="text"
                placeholder="Nombre del invitado"
                value={guestDraft}
                onChange={(e) => setGuestDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary min-h-11 min-w-11"
                onClick={() => addGuest(dateId)}
                aria-label="Agregar"
              >
                <Icon name="plus" size={17} />
              </button>
            </div>
            <div className="flex flex-col">
              {(guestsByDate[dateId] || []).map((g, i) => {
                const [tagClass, tagLabel] = guestTag(g.status);
                return (
                  <div key={i} className="flex items-center gap-2 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-semibold text-[17px]">{g.name}</div>
                      <div className="text-xs text-neutral-700">{g.by}</div>
                    </div>
                    <span className={tagClass}>{tagLabel}</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon w-10 h-10"
                      onClick={() => cycleGuestStatus(dateId, i)}
                      aria-label="Cambiar estado"
                    >
                      <Icon name="arrows-clockwise" size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h6 className="mb-3">Toda la gira</h6>
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Conf.</th>
                  <th>Pend.</th>
                </tr>
              </thead>
              <tbody>
                {DATES.map((x) => {
                  const list = guestsByDate[x.id] || [];
                  const pend = list.filter((g) => g.status === "pending").length;
                  return (
                    <tr key={x.id}>
                      <td>
                        {x.dow} {x.day} · {x.kind}
                      </td>
                      <td className="tabular-nums">{list.filter((g) => g.status === "confirmed").length}</td>
                      <td>
                        <span className={pend ? "tag tag-accent-2" : "tag tag-neutral"}>{pend}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {crewSel && (
        <div className="max-w-[520px] pt-6">
          <div className="card elev-md">
            <div className="flex items-center gap-2">
              <span className="card-kicker mr-auto">{crewDetail.role}</span>
              <button type="button" className="btn btn-ghost min-h-10" onClick={() => setCrewSel(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="card-title text-[22px]">{crewDetail.name}</div>
            <div className="flex flex-wrap gap-1">
              <span className="tag tag-neutral">{PARTIES[crewDetail.party].label}</span>
              <span className="tag tag-neutral">Equipo: {crewDetail.team}</span>
            </div>
            <div className="text-sm leading-[1.6]">
              {crewDetail.email}
              <br />
              {crewDetail.tel}
            </div>
            <p className="card-body">{crewDetail.scope}</p>
            <div className="card-meta">
              <Icon name="git-fork" size={15} />
              <span>{crewDetail.reports}</span>
            </div>
            <div className="flex gap-2">
              <a className="btn btn-primary min-h-11" href={`tel:${crewDetail.tel}`}>
                <Icon name="phone-call" size={17} />
                Llamar
              </a>
              <a className="btn btn-secondary min-h-11" href={`mailto:${crewDetail.email}`}>
                <Icon name="envelope-simple" size={17} />
                Correo
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { CONTACT_TYPES, EQUIPO_TABS, GROUP_MODES, GUEST_STATES, type Locale } from "@gigbridge/config";
import { buildGroups, guestTag } from "@gigbridge/data";
import { chipClass } from "@/lib/ui";
import { AddPersonDialog, InvitePanel } from "./CrewInvite";
import type { EquipoTabId, ExternalContact, RosterPerson, TourDate, Vacancy } from "@gigbridge/types";

export function EquipoView({
  dateId,
  tab,
  roster: ROSTER,
  vacancies: VACANCIES,
  externalContacts: EXTERNAL_CONTACTS,
  dates: DATES,
  crewRoles = [],
}: {
  dateId: string;
  tab: EquipoTabId;
  roster: RosterPerson[];
  vacancies: Vacancy[];
  externalContacts: ExternalContact[];
  dates: TourDate[];
  /** Catálogo de roles operativos para "Agregar persona" (solo datos reales). */
  crewRoles?: Array<{ id: string; name: string; department: string }>;
}) {
  const {
    source,
    summary,
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
    setGuestStatus,
    canAdmin,
    canContribute,
  } = useTourUI();
  const t = useTranslations("tour");
  const locale = useLocale() as Locale;
  const live = source === "supabase";
  const [adding, setAdding] = useState(false);
  const teamName = (team: string) => (t.has(`teams.${team}`) ? t(`teams.${team}`) : team);
  const accountLabel = { Todos: t("equipo.accountAll"), "Con cuenta": t("equipo.account"), Freelance: t("equipo.freelance") };

  // La ficha de una persona es un panel sobre la página: se cierra con Esc
  // y al salir de la pestaña Crew, para que no quede abierta en otra vista.
  useEffect(() => {
    if (!crewSel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCrewSel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [crewSel, setCrewSel]);

  const eqId = (EQUIPO_TABS.find((x) => x.id === tab) ?? EQUIPO_TABS[0]).id;
  const lensed = lens === "Todos" ? ROSTER : ROSTER.filter((p) => p.party === lens);
  const lensedVac = lens === "Todos" ? VACANCIES : VACANCIES.filter((v) => v.party === lens);
  const modeId = (GROUP_MODES.find((m) => m.id === groupBy) ?? GROUP_MODES[0]).id;

  const groupsRaw = buildGroups(lensed, lensedVac, groupBy, locale);
  const crewRoster = lensed.filter(
    (p) => accountFilter === "Todos" || (accountFilter === "Con cuenta" ? p.account : !p.account)
  );
  const crewGroupsRaw = buildGroups(crewRoster, lensedVac, groupBy, locale);

  const lensName =
    lens === "Todos"
      ? t("equipo.lensAll", { tour: summary.name })
      : t("equipo.lensParty", { tour: summary.name, party: t(`parties.${lens}.name`) });
  const equipoTitle = t(`equipoTabs.${eqId}.label`);
  const showGroupModes = ["crew", "areas", "ubicaciones"].includes(tab);
  const equipoHelp = t(`equipoTabs.${eqId}.help`);

  const crewDetail = tab === "crew" ? ROSTER.find((x) => x.name === crewSel) : undefined;
  const guests = guestsByDate[dateId] || [];

  return (
    <div className="pt-6">
      <div className="flex items-end gap-6 flex-wrap">
        <div className="flex-[1_1_360px] min-w-[320px]">
          <div className="text-xs tracking-[0.1em] uppercase text-neutral-700">{lensName}</div>
          <h1 className="text-[40px] sm:text-[48px] my-1 mb-2 tracking-[-0.03em]">{equipoTitle}</h1>
          <p className="text-base m-0 max-w-[56ch] text-pretty">{equipoHelp}</p>
        </div>
        <nav aria-label={t("equipo.viewsLabel")} className="flex gap-1 flex-wrap">
          {EQUIPO_TABS.map((x) => (
            <Link
              key={x.id}
              href={`/tour/${dateId}/equipo/${x.id}`}
              aria-current={tab === x.id ? "page" : undefined}
              onClick={() => setCrewSel(null)}
              className={chipClass(tab === x.id)}
            >
              {t(`equipoTabs.${x.id}.label`)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-2 pt-4 pb-6">
        {showGroupModes && (
          <FilterRow label={t("equipo.filterGroup")}>
            {GROUP_MODES.map((g) => (
              <button key={g.id} type="button" onClick={() => setGroupBy(g.id)} aria-pressed={groupBy === g.id} className={chipClass(groupBy === g.id, true)}>
                {t(`groupModes.${g.id}.label`)}
              </button>
            ))}
          </FilterRow>
        )}
        {showGroupModes && <p className="text-xs text-neutral-700 m-0">{t(`groupModes.${modeId}.help`)}</p>}
        {tab === "crew" && (
          <FilterRow label={t("equipo.filterShow")}>
            {(["Todos", "Con cuenta", "Freelance"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setAccountFilter(f)} aria-pressed={accountFilter === f} className={chipClass(accountFilter === f, true)}>
                {accountLabel[f]}
              </button>
            ))}
          </FilterRow>
        )}
        {tab === "crew" && (
          <p className="text-xs text-neutral-700 m-0">{t("equipo.accountHelp")}</p>
        )}
        {tab === "crew" && live && canAdmin && (
          <button type="button" className="btn btn-secondary min-h-10 self-start" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} />
            {t("equipo.addPerson")}
          </button>
        )}
        {tab === "contactos" && (
          <FilterRow label={t("equipo.filterType")}>
            {CONTACT_TYPES.filter((f) => f === "Todos" || f === "Gira" || EXTERNAL_CONTACTS.some((c) => c.type === f)).map((f) => (
              <button key={f} type="button" onClick={() => setContactType(f)} aria-pressed={contactType === f} className={chipClass(contactType === f, true)}>
                {t(`contactTypes.${f}`)}
              </button>
            ))}
          </FilterRow>
        )}
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
                    {g.vacancies.length ? ` · ${t("equipo.vacancies", { count: g.vacancies.length })}` : ""}
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
                        {c.account ? t("equipo.account") : t("equipo.freelance")}
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
                role: `${p.role} · ${teamName(p.team)}`,
                person: p.name,
                real: true,
                account: p.account,
              }))
              .concat(
                g.vacancies.map((v) => ({
                  role: `${v.role} · ${teamName(v.team)}`,
                  person: t("equipo.unassigned"),
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
                    <div className="text-[13px] text-neutral-700">{t("equipo.people", { count: n })}</div>
                    <div className="text-[13px] text-accent-700">
                      {chief ? `${t(`groupModes.${modeId}.lead`)}: ${chief.name}` : t("equipo.noLead")}
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
                          {!r.real ? t("equipo.vacancy") : r.account ? t("equipo.account") : t("equipo.freelance")}
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
                    <span className="text-xs text-neutral-700 tabular-nums">{t("equipo.people", { count: g.people.length })}</span>
                  </div>
                  <table className="table mt-2">
                    <thead>
                      <tr>
                        <th>{t("equipo.colPerson")}</th>
                        <th>{t("equipo.colRole")}</th>
                        <th>{t("equipo.colHotel")}</th>
                        <th>{t("equipo.colRoom")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.people.map((p) => {
                        const oculto = p.roomHidden ?? (p.roomScope === "self" || p.roomScope === "custom");
                        const room = p.room === "n/a" ? t("equipo.notTraveling") : oculto ? t("equipo.hidden") : p.room;
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
              {t(live ? "equipo.hiddenHelpLive" : "equipo.hiddenHelpDemo")}
            </span>
          </div>
        </div>
      )}

      {tab === "contactos" && (
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 items-start">
          {EXTERNAL_CONTACTS.concat(
            lensed.map((p: RosterPerson) => ({
              name: p.name,
              role: `${p.role} · ${teamName(p.team)}`,
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
                    {c.type in CONTACT_LABEL_KEYS ? t(`contactTypes.${c.type as (typeof CONTACT_TYPES)[number]}`) : c.type}
                  </span>
                </div>
                <div className="text-sm mt-2 leading-[1.6] break-words">
                  {c.email}
                  <br />
                  {c.phone}
                </div>
                <div className="text-[13px] italic text-neutral-700 mt-[3px]">{c.note || t("equipo.noNotes")}</div>
                <div className="flex gap-2 mt-2">
                  {c.tel && (
                    <a className="btn btn-secondary min-h-10" href={`tel:${c.tel.replace(/\s/g, "")}`} aria-label={t("common.callTo", { name: c.name })}>
                      <Icon name="phone" size={17} />
                      {t("common.call")}
                    </a>
                  )}
                  {c.email && (
                    <a className="btn btn-secondary min-h-10" href={`mailto:${c.email}`} aria-label={t("common.writeTo", { name: c.name })}>
                      <Icon name="envelope-simple" size={17} />
                      {t("common.email")}
                    </a>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === "invitados" && !canContribute && <p className="text-sm text-neutral-700">{t("equipo.guestsNoAccess")}</p>}

      {tab === "invitados" && canContribute && (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-8">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <div className="font-heading font-semibold text-[46px] leading-none tabular-nums">
                {guests.filter((g) => g.status !== "denied").length}
              </div>
              <div className="text-sm text-neutral-700">
                {t("equipo.guestsInList", { pending: guests.filter((g) => g.status === "pending").length })}
              </div>
            </div>
            <form
              className="flex gap-2 pt-4 max-w-[460px]"
              onSubmit={(e) => {
                e.preventDefault();
                addGuest(dateId);
              }}
            >
              <input
                className="input min-h-11"
                type="text"
                placeholder={t("equipo.guestPlaceholder")}
                aria-label={t("equipo.guestLabel")}
                value={guestDraft}
                onChange={(e) => setGuestDraft(e.target.value)}
              />
              <button type="submit" className="btn btn-primary min-h-11 min-w-11" aria-label={t("equipo.addGuest")}>
                <Icon name="plus" size={17} />
              </button>
            </form>
            <p className="text-xs text-neutral-700 pt-2 pb-4 max-w-[460px]">
              {t("equipo.guestsHelp")}
              {live ? ` ${t("equipo.guestsAdminOnly")}` : ""}
            </p>
            {guests.length === 0 && <p className="text-sm text-neutral-700">{t("equipo.guestsEmpty")}</p>}
            <div className="flex flex-col">
              {guests.map((g, i) => {
                const [tagClass, tagLabel] = guestTag(g.status, locale);
                return (
                  <div key={g.id ?? i} className="flex items-center gap-2 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-semibold text-[17px]">{g.name}</div>
                      <div className="text-xs text-neutral-700">{g.by}</div>
                    </div>
                    {!canAdmin ? (
                      <span className={tagClass}>{tagLabel}</span>
                    ) : (
                    <>
                    <label className="sr-only" htmlFor={`guest-status-${i}`}>
                      {t("equipo.guestStatusOf", { name: g.name })}
                    </label>
                    <select
                      id={`guest-status-${i}`}
                      className={tagClass + " cursor-pointer"}
                      value={g.status}
                      onChange={(e) => setGuestStatus(dateId, i, e.target.value as (typeof GUEST_STATES)[number])}
                    >
                      {GUEST_STATES.map((st) => (
                        <option key={st} value={st}>
                          {t(`guestStatus.${st}`)}
                        </option>
                      ))}
                    </select>
                    </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h6 className="mb-3">{t("equipo.wholeTour")}</h6>
            <table className="table">
              <thead>
                <tr>
                  <th>{t("equipo.colDate")}</th>
                  <th>{t("equipo.colConfirmed")}</th>
                  <th>{t("equipo.colPending")}</th>
                </tr>
              </thead>
              <tbody>
                {DATES.map((x) => {
                  const list = guestsByDate[x.id] || [];
                  const pend = list.filter((g) => g.status === "pending").length;
                  return (
                    <tr key={x.id} className={x.id === dateId ? "font-semibold" : undefined}>
                      <td>
                        <Link href={`/tour/${x.id}/equipo/invitados`} className="underline-offset-2 hover:underline">
                          {x.dow} {x.day} · {t(`kind.${x.kind}`)}
                        </Link>
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

      {adding && <AddPersonDialog dateId={dateId} roles={crewRoles} onClose={() => setAdding(false)} />}

      {crewDetail && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={() => setCrewSel(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="crew-detail-name"
            className="card elev-md w-full max-w-[520px] max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="card-kicker mr-auto">{crewDetail.role}</span>
              <button type="button" className="btn btn-ghost min-h-10" onClick={() => setCrewSel(null)} aria-label={t("equipo.closeDetail")}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div id="crew-detail-name" className="card-title text-[22px]">
              {crewDetail.name}
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="tag tag-neutral">{t(`parties.${crewDetail.party}.label`)}</span>
              <span className="tag tag-neutral">{t("equipo.team", { team: teamName(crewDetail.team) })}</span>
              <span className={crewDetail.account ? "tag tag-accent" : "tag tag-outline"}>
                {crewDetail.account ? t("equipo.account") : t("equipo.freelance")}
              </span>
            </div>
            <div className="text-sm leading-[1.6] break-words">
              {crewDetail.email || t("equipo.noEmail")}
              <br />
              {crewDetail.tel || t("equipo.noPhone")}
            </div>
            <p className="card-body">{crewDetail.scope}</p>
            {live && canAdmin && !crewDetail.account && crewDetail.tourCrewId && (
              <InvitePanel key={crewDetail.tourCrewId} tourCrewId={crewDetail.tourCrewId} name={crewDetail.name} email={crewDetail.email} />
            )}
            <div className="card-meta">
              <Icon name="git-fork" size={15} />
              <span>{crewDetail.reports}</span>
            </div>
            <div className="flex gap-2">
              {crewDetail.tel && (
                <a className="btn btn-primary min-h-11" href={`tel:${crewDetail.tel}`}>
                  <Icon name="phone-call" size={17} />
                  {t("common.call")}
                </a>
              )}
              {crewDetail.email && (
                <a className="btn btn-secondary min-h-11" href={`mailto:${crewDetail.email}`}>
                  <Icon name="envelope-simple" size={17} />
                  {t("common.email")}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CONTACT_LABEL_KEYS: Record<string, true> = Object.fromEntries(CONTACT_TYPES.map((k) => [k, true]));

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] tracking-[0.1em] uppercase text-neutral-700 w-[72px] flex-none">{label}</span>
      <div className="flex gap-1 flex-wrap">{children}</div>
    </div>
  );
}

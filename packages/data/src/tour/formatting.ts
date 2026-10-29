import { DEFAULT_LOCALE, DEPT_ORDER, PARTIES, TEAMS, TEAM_ORDER, tourMessages, type Locale } from "@gigbridge/config";
import type { DocFile, FileStatus, GroupModeId, GuestStatus, PartyKey, RosterPerson, Vacancy } from "@gigbridge/types";
import { fileIcon } from "./mockData";

/**
 * Funciones puras de agregación/formato sobre datos de gira — no dependen
 * del DOM ni de React, así que se comparten igual desde la app nativa.
 */

export interface RosterGroup {
  key: string;
  name: string;
  icon: string;
  subtitle: string;
  people: RosterPerson[];
  vacancies: Vacancy[];
}

export function buildGroups(
  roster: RosterPerson[],
  vacancies: Vacancy[],
  mode: GroupModeId,
  locale: Locale = DEFAULT_LOCALE
): RosterGroup[] {
  const tx = tourMessages(locale);
  if (mode === "party") {
    return (["A", "B", "C"] as PartyKey[]).map((k) => ({
      key: k,
      name: tx.parties[k].name,
      icon: PARTIES[k].icon,
      subtitle: tx.parties[k].blurb,
      people: roster.filter((p) => p.party === k),
      vacancies: vacancies.filter((v) => v.party === k),
    }));
  }
  if (mode === "equipo") {
    return TEAM_ORDER.map((t) => ({
      key: t,
      name: tx.teams[t] ?? t,
      icon: TEAMS[t].icon,
      subtitle: tx.departments[TEAMS[t].dept] ?? TEAMS[t].dept,
      people: roster.filter((p) => p.team === t),
      vacancies: vacancies.filter((v) => v.team === t),
    })).filter((g) => g.people.length || g.vacancies.length);
  }
  if (mode === "depto") {
    return DEPT_ORDER.map((d) => ({
      key: d,
      name: tx.departments[d] ?? d,
      icon: "squares-four",
      subtitle: tx.data.deptSubtitle,
      people: roster.filter((p) => TEAMS[p.team]?.dept === d),
      vacancies: vacancies.filter((v) => TEAMS[v.team]?.dept === d),
    })).filter((g) => g.people.length || g.vacancies.length);
  }
  return [
    {
      key: "chain",
      name: tx.data.chainName,
      icon: "tree-structure",
      subtitle: tx.data.chainSubtitle,
      // El repositorio (mock y Supabase) ya entrega el roster en orden de
      // cadena de mando; aquí solo se respeta.
      people: roster.slice(),
      vacancies,
    },
  ];
}

const FILE_TAG_CLASS: Record<FileStatus, string> = {
  falta: "tag tag-accent-2",
  revisar: "tag tag-accent-2",
  nuevo: "tag tag-outline",
  vigente: "tag tag-accent",
};

const GUEST_TAG_CLASS: Record<GuestStatus, string> = {
  confirmed: "tag tag-accent",
  denied: "tag tag-neutral",
  pending: "tag tag-accent-2",
};

export function fileTag(status: FileStatus, locale: Locale = DEFAULT_LOCALE): [string, string] {
  return [FILE_TAG_CLASS[status], tourMessages(locale).fileStatus[status]];
}

export function guestTag(status: GuestStatus, locale: Locale = DEFAULT_LOCALE): [string, string] {
  return [GUEST_TAG_CLASS[status], tourMessages(locale).guestStatus[status]];
}

export function mapFiles(list: DocFile[], locale: Locale = DEFAULT_LOCALE) {
  return list.map((f) => {
    const [tagClass, tagLabel] = fileTag(f.status, locale);
    return {
      name: f.name,
      meta: f.meta,
      icon: fileIcon(f.kind),
      tagClass,
      tagLabel,
      status: f.status,
      url: f.url,
      documentId: f.documentId,
    };
  });
}

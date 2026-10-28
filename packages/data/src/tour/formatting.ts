import { DEPT_ORDER, PARTIES, TEAMS, TEAM_ORDER } from "@gigbridge/config";
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

export function buildGroups(roster: RosterPerson[], vacancies: Vacancy[], mode: GroupModeId): RosterGroup[] {
  if (mode === "party") {
    return (["A", "B", "C"] as PartyKey[]).map((k) => ({
      key: k,
      name: PARTIES[k].name,
      icon: PARTIES[k].icon,
      subtitle: PARTIES[k].blurb,
      people: roster.filter((p) => p.party === k),
      vacancies: vacancies.filter((v) => v.party === k),
    }));
  }
  if (mode === "equipo") {
    return TEAM_ORDER.map((t) => ({
      key: t,
      name: t,
      icon: TEAMS[t].icon,
      subtitle: TEAMS[t].dept,
      people: roster.filter((p) => p.team === t),
      vacancies: vacancies.filter((v) => v.team === t),
    })).filter((g) => g.people.length || g.vacancies.length);
  }
  if (mode === "depto") {
    return DEPT_ORDER.map((d) => ({
      key: d,
      name: d,
      icon: "squares-four",
      subtitle: "Departamento del catálogo",
      people: roster.filter((p) => TEAMS[p.team]?.dept === d),
      vacancies: vacancies.filter((v) => TEAMS[v.team]?.dept === d),
    })).filter((g) => g.people.length || g.vacancies.length);
  }
  return [
    {
      key: "chain",
      name: "Cadena de mando",
      icon: "tree-structure",
      subtitle: "Del Tour Manager hacia abajo, según reports_to",
      // El repositorio (mock y Supabase) ya entrega el roster en orden de
      // cadena de mando; aquí solo se respeta.
      people: roster.slice(),
      vacancies,
    },
  ];
}

export function fileTag(status: FileStatus): [string, string] {
  if (status === "falta") return ["tag tag-accent-2", "Falta"];
  if (status === "revisar") return ["tag tag-accent-2", "Revisar"];
  if (status === "nuevo") return ["tag tag-outline", "Pendiente de subir"];
  return ["tag tag-accent", "Vigente"];
}

export function guestTag(status: GuestStatus): [string, string] {
  if (status === "confirmed") return ["tag tag-accent", "Confirmado"];
  if (status === "denied") return ["tag tag-neutral", "Negado"];
  return ["tag tag-accent-2", "Pendiente"];
}

export function mapFiles(list: DocFile[]) {
  return list.map((f) => {
    const [tagClass, tagLabel] = fileTag(f.status);
    return { name: f.name, meta: f.meta, icon: fileIcon(f.kind), tagClass, tagLabel };
  });
}

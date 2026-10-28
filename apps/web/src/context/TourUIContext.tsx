"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_HITOS,
  DEFAULT_NOTAS,
  DEFAULT_REMINDERS,
  DEFAULT_SETLIST,
  DEFAULT_VEHICLES,
  GUESTS_SEED,
  type NotaEntry,
} from "@gigbridge/data";
import { GUEST_STATES } from "@gigbridge/config";
import type {
  DocFile,
  GroupModeId,
  Guest,
  Hito,
  NoteEntry,
  PartyKey,
  ProviderBucket,
  Reminder,
  SetlistSong,
  VehicleLoad,
} from "@gigbridge/types";

interface TourUIState {
  night: boolean;
  lens: "Todos" | PartyKey;
  groupBy: GroupModeId;
  accountFilter: "Todos" | "Con cuenta" | "Freelance";
  contactType: string;
  bucket: ProviderBucket;
  filtro: string;
  hitos: Hito[];
  setlist: SetlistSong[];
  vehicles: VehicleLoad[];
  reminders: Reminder[];
  notas: NotaEntry[];
  guestsByDate: Record<string, Guest[]>;
  extraVenueFiles: Record<string, DocFile[]>;
  extraVenueNotes: Record<string, NoteEntry[]>;
  extraShowFiles: Record<string, DocFile[]>;
  extraShowNotes: Record<string, NoteEntry[]>;
  notaDraft: string;
  venueNoteDraft: string;
  showNoteDraft: string;
  guestDraft: string;
  groupOpen: string | null;
  crewSel: string | null;
  adopted: boolean | null;
}

function initialState(): TourUIState {
  return {
    night: false,
    lens: "Todos",
    groupBy: "party",
    accountFilter: "Todos",
    contactType: "Todos",
    bucket: "recinto",
    filtro: "Todos",
    hitos: DEFAULT_HITOS.map((h) => ({ ...h })),
    setlist: DEFAULT_SETLIST.map((s) => ({ ...s })),
    vehicles: DEFAULT_VEHICLES.map((v) => ({ ...v })),
    reminders: DEFAULT_REMINDERS.map((r) => ({ ...r })),
    notas: DEFAULT_NOTAS.map((n) => ({ ...n })),
    guestsByDate: Object.fromEntries(
      Object.entries(GUESTS_SEED).map(([k, v]) => [k, v.map((g) => ({ ...g }))])
    ),
    extraVenueFiles: {},
    extraVenueNotes: {},
    extraShowFiles: {},
    extraShowNotes: {},
    notaDraft: "",
    venueNoteDraft: "",
    showNoteDraft: "",
    guestDraft: "",
    groupOpen: "C",
    crewSel: null,
    adopted: null,
  };
}

interface TourUIContextValue extends TourUIState {
  toggleNight: () => void;
  setLens: (lens: "Todos" | PartyKey) => void;
  setGroupBy: (mode: GroupModeId) => void;
  setAccountFilter: (f: "Todos" | "Con cuenta" | "Freelance") => void;
  setContactType: (t: string) => void;
  setBucket: (b: ProviderBucket) => void;
  setFiltro: (f: string) => void;
  setGroupOpen: (key: string | null) => void;
  toggleGroupOpen: (key: string) => void;
  setCrewSel: (name: string | null) => void;
  toggleHito: (id: string) => void;
  moveSetlist: (index: number, dir: -1 | 1) => void;
  moveVehicle: (index: number, dir: -1 | 1) => void;
  adoptRider: () => void;
  dismissReminder: (index: number) => void;
  addReminder: (r: Reminder) => void;
  setNotaDraft: (v: string) => void;
  addNota: (origen: string) => void;
  setVenueNoteDraft: (v: string) => void;
  addVenueNote: (dateId: string) => void;
  addVenueFile: (dateId: string) => void;
  setShowNoteDraft: (v: string) => void;
  addShowNote: (dateId: string) => void;
  addShowFile: (dateId: string) => void;
  setGuestDraft: (v: string) => void;
  addGuest: (dateId: string) => void;
  cycleGuestStatus: (dateId: string, index: number) => void;
}

const TourUIContext = createContext<TourUIContextValue | null>(null);

export function TourUIProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TourUIState>(initialState);

  useEffect(() => {
    const root = document.documentElement;
    if (state.night) root.setAttribute("data-theme", "night");
    else root.removeAttribute("data-theme");
  }, [state.night]);

  function move<T>(key: "setlist" | "vehicles", index: number, dir: -1 | 1) {
    setState((st) => {
      const arr = (st[key] as T[]).slice();
      const j = index + dir;
      if (j < 0 || j >= arr.length) return st;
      const tmp = arr[index];
      arr[index] = arr[j];
      arr[j] = tmp;
      return { ...st, [key]: arr };
    });
  }

  const value: TourUIContextValue = {
    ...state,
    toggleNight: () => setState((st) => ({ ...st, night: !st.night })),
    setLens: (lens) =>
      setState((st) => ({
        ...st,
        lens,
        crewSel: null,
        groupOpen: lens === "Todos" ? "C" : null,
      })),
    setGroupBy: (groupBy) => setState((st) => ({ ...st, groupBy, groupOpen: null, crewSel: null })),
    setAccountFilter: (accountFilter) => setState((st) => ({ ...st, accountFilter, crewSel: null })),
    setContactType: (contactType) => setState((st) => ({ ...st, contactType })),
    setBucket: (bucket) => setState((st) => ({ ...st, bucket, filtro: "Todos" })),
    setFiltro: (filtro) => setState((st) => ({ ...st, filtro })),
    setGroupOpen: (groupOpen) => setState((st) => ({ ...st, groupOpen })),
    toggleGroupOpen: (key) => setState((st) => ({ ...st, groupOpen: st.groupOpen === key ? null : key })),
    setCrewSel: (crewSel) => setState((st) => ({ ...st, crewSel })),
    toggleHito: (id) =>
      setState((st) => ({
        ...st,
        hitos: st.hitos.map((h) => (h.id === id ? { ...h, done: !h.done } : h)),
      })),
    moveSetlist: (index, dir) => move<SetlistSong>("setlist", index, dir),
    moveVehicle: (index, dir) => move<VehicleLoad>("vehicles", index, dir),
    adoptRider: () => setState((st) => ({ ...st, adopted: true })),
    dismissReminder: (index) =>
      setState((st) => ({ ...st, reminders: st.reminders.filter((_, i) => i !== index) })),
    addReminder: (r) => setState((st) => ({ ...st, reminders: st.reminders.concat([r]) })),
    setNotaDraft: (notaDraft) => setState((st) => ({ ...st, notaDraft })),
    addNota: (origen) =>
      setState((st) => {
        const body = st.notaDraft.trim();
        if (!body) return st;
        return {
          ...st,
          notaDraft: "",
          notas: [{ origen, body, meta: "Tú · ahora · 11 del crew notificados" }].concat(st.notas),
        };
      }),
    setVenueNoteDraft: (venueNoteDraft) => setState((st) => ({ ...st, venueNoteDraft })),
    addVenueNote: (dateId) =>
      setState((st) => {
        const body = st.venueNoteDraft.trim();
        if (!body) return st;
        return {
          ...st,
          venueNoteDraft: "",
          extraVenueNotes: {
            ...st.extraVenueNotes,
            [dateId]: [{ body, meta: "Tú · ahora" }].concat(st.extraVenueNotes[dateId] || []),
          },
        };
      }),
    addVenueFile: (dateId) =>
      setState((st) => ({
        ...st,
        extraVenueFiles: {
          ...st.extraVenueFiles,
          [dateId]: (st.extraVenueFiles[dateId] || []).concat([
            { name: "Documento nuevo del lugar", kind: "pdf", meta: "Subido por ti · ahora", status: "nuevo" },
          ]),
        },
      })),
    setShowNoteDraft: (showNoteDraft) => setState((st) => ({ ...st, showNoteDraft })),
    addShowNote: (dateId) =>
      setState((st) => {
        const body = st.showNoteDraft.trim();
        if (!body) return st;
        return {
          ...st,
          showNoteDraft: "",
          extraShowNotes: {
            ...st.extraShowNotes,
            [dateId]: [{ body, meta: "Tú · ahora · visible para el stage manager" }].concat(
              st.extraShowNotes[dateId] || []
            ),
          },
        };
      }),
    addShowFile: (dateId) =>
      setState((st) => ({
        ...st,
        extraShowFiles: {
          ...st.extraShowFiles,
          [dateId]: (st.extraShowFiles[dateId] || []).concat([
            { name: "Documento técnico nuevo", kind: "pdf", meta: "Subido por ti · ahora", status: "nuevo" },
          ]),
        },
      })),
    setGuestDraft: (guestDraft) => setState((st) => ({ ...st, guestDraft })),
    addGuest: (dateId) =>
      setState((st) => {
        const name = st.guestDraft.trim();
        if (!name) return st;
        return {
          ...st,
          guestDraft: "",
          guestsByDate: {
            ...st.guestsByDate,
            [dateId]: (st.guestsByDate[dateId] || []).concat([
              { name, by: "Agregado por ti · ahora", status: "pending" },
            ]),
          },
        };
      }),
    cycleGuestStatus: (dateId, index) =>
      setState((st) => ({
        ...st,
        guestsByDate: {
          ...st.guestsByDate,
          [dateId]: (st.guestsByDate[dateId] || []).map((g, i) =>
            i === index
              ? { ...g, status: GUEST_STATES[(GUEST_STATES.indexOf(g.status) + 1) % 3] }
              : g
          ),
        },
      })),
  };

  return <TourUIContext.Provider value={value}>{children}</TourUIContext.Provider>;
}

export function useTourUI() {
  const ctx = useContext(TourUIContext);
  if (!ctx) throw new Error("useTourUI must be used within TourUIProvider");
  return ctx;
}

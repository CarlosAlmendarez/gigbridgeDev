"use client";

import { createContext, useContext, useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_HITOS, DEFAULT_REMINDERS, DEFAULT_VEHICLES, type NotaEntry, type TourDataSource } from "@gigbridge/data";
import { GUEST_STATES } from "@gigbridge/config";
import { addDateNoteAction, addGuestAction, moveSetlistAction } from "@/lib/actions/tour";
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
  syncError: string | null;
}

/**
 * Datos que el layout lee del repositorio (mock o Supabase). Con la gira
 * mock son solo el estado inicial y se editan en memoria; con Supabase son
 * la fuente de verdad: las acciones escriben y la página se vuelve a
 * renderizar con datos nuevos, así que no hay copia local que sincronizar.
 */
export interface TourServerData {
  source: TourDataSource;
  /** Fecha del layout: el setlist es de esta fecha. */
  dateId: string;
  guestsByDate: Record<string, Guest[]>;
  setlist: SetlistSong[];
  notas: NotaEntry[];
}

function initialState(data: TourServerData): TourUIState {
  return {
    night: false,
    lens: "Todos",
    groupBy: "party",
    accountFilter: "Todos",
    contactType: "Todos",
    bucket: "recinto",
    filtro: "Todos",
    hitos: DEFAULT_HITOS.map((h) => ({ ...h })),
    setlist: data.setlist.map((s) => ({ ...s })),
    vehicles: DEFAULT_VEHICLES.map((v) => ({ ...v })),
    reminders: DEFAULT_REMINDERS.map((r) => ({ ...r })),
    notas: data.notas.map((n) => ({ ...n })),
    guestsByDate: Object.fromEntries(
      Object.entries(data.guestsByDate).map(([k, v]) => [k, v.map((g) => ({ ...g }))])
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
    syncError: null,
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
  /** `dateId` es la fecha a la que se cuelga la nota cuando se guarda en Supabase. */
  addNota: (origen: string, dateId: string) => void;
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

export function TourUIProvider({ children, data }: { children: ReactNode; data: TourServerData }) {
  const [state, setState] = useState<TourUIState>(() => initialState(data));
  const [, startTransition] = useTransition();
  const router = useRouter();
  const live = data.source === "supabase";

  /**
   * Escritura contra Supabase: corre la acción en una transición, limpia el
   * borrador si salió bien y muestra el mensaje si la RLS o la validación la
   * rechazaron. La Server Action ya revalida la página; `refresh` es para
   * escrituras que van por fetch (el PATCH REST de invitados).
   */
  function sync(task: () => Promise<{ ok: boolean; message?: string }>, onOk?: Partial<TourUIState>, refresh = false) {
    startTransition(async () => {
      try {
        const result = await task();
        if (!result.ok) return setState((st) => ({ ...st, syncError: result.message ?? "No se pudo guardar." }));
        setState((st) => ({ ...st, ...onOk, syncError: null }));
        if (refresh) router.refresh();
      } catch (err) {
        console.error(err);
        setState((st) => ({ ...st, syncError: "Sin conexión: el cambio no se guardó." }));
      }
    });
  }

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
    ...(live ? { guestsByDate: data.guestsByDate, setlist: data.setlist, notas: data.notas } : {}),
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
    moveSetlist: (index, dir) => {
      if (!live) return move<SetlistSong>("setlist", index, dir);
      const to = index + dir;
      if (to < 0 || to >= data.setlist.length) return;
      sync(() => moveSetlistAction(data.dateId, index, to));
    },
    moveVehicle: (index, dir) => move<VehicleLoad>("vehicles", index, dir),
    adoptRider: () => setState((st) => ({ ...st, adopted: true })),
    dismissReminder: (index) =>
      setState((st) => ({ ...st, reminders: st.reminders.filter((_, i) => i !== index) })),
    addReminder: (r) => setState((st) => ({ ...st, reminders: st.reminders.concat([r]) })),
    setNotaDraft: (notaDraft) => setState((st) => ({ ...st, notaDraft })),
    addNota: (origen, dateId) => {
      if (live) {
        const body = state.notaDraft.trim();
        if (body) sync(() => addDateNoteAction(dateId, "tour_date", body), { notaDraft: "" });
        return;
      }
      setState((st) => {
        const body = st.notaDraft.trim();
        if (!body) return st;
        return {
          ...st,
          notaDraft: "",
          notas: [{ origen, body, meta: "Tú · ahora · 11 del crew notificados" }].concat(st.notas),
        };
      });
    },
    setVenueNoteDraft: (venueNoteDraft) => setState((st) => ({ ...st, venueNoteDraft })),
    addVenueNote: (dateId) => {
      if (live) {
        const body = state.venueNoteDraft.trim();
        if (body) sync(() => addDateNoteAction(dateId, "venue", body), { venueNoteDraft: "" });
        return;
      }
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
      });
    },
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
    addShowNote: (dateId) => {
      if (live) {
        const body = state.showNoteDraft.trim();
        if (body) sync(() => addDateNoteAction(dateId, "tour_date", body), { showNoteDraft: "" });
        return;
      }
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
      });
    },
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
    addGuest: (dateId) => {
      if (live) {
        const name = state.guestDraft.trim();
        if (name) sync(() => addGuestAction(dateId, name), { guestDraft: "" });
        return;
      }
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
      });
    },
    cycleGuestStatus: (dateId, index) => {
      if (live) {
        const guest = data.guestsByDate[dateId]?.[index];
        if (!guest?.id) return;
        const status = GUEST_STATES[(GUEST_STATES.indexOf(guest.status) + 1) % 3];
        // Por el endpoint REST (no Server Action) porque además manda el
        // correo con Resend — ver su route.ts.
        sync(
          async () => {
            const res = await fetch(`/api/v1/tour-dates/${dateId}/guests/${guest.id}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });
            if (res.ok) return { ok: true };
            const { error } = (await res.json().catch(() => ({}))) as { error?: unknown };
            return {
              ok: false,
              message: res.status === 404 ? "Solo un admin de la gira puede cambiar el status." : typeof error === "string" ? error : "No se pudo cambiar el status.",
            };
          },
          undefined,
          true
        );
        return;
      }
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
      }));
    },
  };

  return (
    <TourUIContext.Provider value={value}>
      {children}
      {state.syncError && (
        <div
          role="alert"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-sm z-50 tag tag-accent-2 !flex items-center justify-between gap-3 !px-4 !py-3 shadow-lg"
        >
          <span>{state.syncError}</span>
          <button type="button" className="font-semibold" onClick={() => setState((st) => ({ ...st, syncError: null }))}>
            Cerrar
          </button>
        </div>
      )}
    </TourUIContext.Provider>
  );
}

export function useTourUI() {
  const ctx = useContext(TourUIContext);
  if (!ctx) throw new Error("useTourUI must be used within TourUIProvider");
  return ctx;
}

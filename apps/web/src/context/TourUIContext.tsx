"use client";

import { createContext, useContext, useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { NotaEntry, TourDataSource } from "@gigbridge/data";
import {
  addDateNoteAction,
  addGuestAction,
  addReminderAction,
  adoptDocumentAction,
  dismissReminderAction,
  moveSetlistAction,
  moveVehicleAction,
} from "@/lib/actions/tour";
import type {
  DocFile,
  GroupModeId,
  Guest,
  GuestStatus,
  NoteEntry,
  PartyKey,
  ProviderBucket,
  Reminder,
  SetlistSong,
  TourSummary,
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
  /** Horarios del "Reloj del día" marcados como cumplidos, por `${dateId}|${hora}|${etiqueta}`. Solo en este dispositivo. */
  clockDone: Record<string, boolean>;
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
  summary: TourSummary;
  vehicles: VehicleLoad[];
  /** Recordatorios propios de la fecha del layout. */
  reminders: Reminder[];
}

type ViewerRole = NonNullable<TourSummary["viewerRole"]>;

function initialState(data: TourServerData): TourUIState {
  return {
    night: false,
    lens: "Todos",
    groupBy: "party",
    accountFilter: "Todos",
    contactType: "Todos",
    bucket: "recinto",
    filtro: "Todos",
    clockDone: {},
    setlist: data.setlist.map((s) => ({ ...s })),
    vehicles: data.vehicles.map((v) => ({ ...v })),
    reminders: data.reminders.map((r) => ({ ...r })),
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
  /** "supabase": los cambios se guardan y los ve el equipo; "mock": demo en memoria. */
  source: TourDataSource;
  summary: TourSummary;
  /** Rol en la gira (0015). La gira de ejemplo se comporta como admin. */
  viewerRole: ViewerRole;
  /** Admin: reordena, confirma invitados, adopta versiones. */
  canAdmin: boolean;
  /** No invitado: agrega invitados y notas. */
  canContribute: boolean;
  /** Admin o jefe de departamento: sube documentos de la fecha. */
  canUpload: boolean;
  /** Sube un documento a la fecha (solo con datos reales). Devuelve si salió bien. */
  uploadDocument: (dateId: string, form: FormData) => Promise<boolean>;
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
  toggleClock: (key: string) => void;
  moveSetlist: (index: number, dir: -1 | 1) => void;
  moveVehicle: (index: number, dir: -1 | 1) => void;
  adoptRider: () => void;
  adoptDocument: (dateId: string, documentId: string) => void;
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
  setGuestStatus: (dateId: string, index: number, status: GuestStatus) => void;
}

const TourUIContext = createContext<TourUIContextValue | null>(null);

export function TourUIProvider({ children, data }: { children: ReactNode; data: TourServerData }) {
  const [state, setState] = useState<TourUIState>(() => initialState(data));
  const [, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("tour");
  const live = data.source === "supabase";
  const viewerRole: ViewerRole = data.summary.viewerRole ?? "admin";

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
        if (!result.ok) return setState((st) => ({ ...st, syncError: result.message ?? t("sync.saveFailed") }));
        setState((st) => ({ ...st, ...onOk, syncError: null }));
        if (refresh) router.refresh();
      } catch (err) {
        console.error(err);
        setState((st) => ({ ...st, syncError: t("sync.offline") }));
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
    ...(live
      ? { guestsByDate: data.guestsByDate, setlist: data.setlist, notas: data.notas, vehicles: data.vehicles, reminders: data.reminders }
      : {}),
    source: data.source,
    summary: data.summary,
    viewerRole,
    canAdmin: viewerRole === "admin",
    canContribute: viewerRole !== "guest",
    canUpload: viewerRole === "admin" || viewerRole === "dept_head",
    uploadDocument: async (dateId, form) => {
      try {
        const res = await fetch(`/api/v1/tour-dates/${dateId}/documents`, { method: "POST", body: form });
        if (res.ok) {
          router.refresh();
          return true;
        }
        const { error } = (await res.json().catch(() => ({}))) as { error?: unknown };
        setState((st) => ({ ...st, syncError: typeof error === "string" ? error : t("sync.saveFailed") }));
      } catch {
        setState((st) => ({ ...st, syncError: t("sync.offline") }));
      }
      return false;
    },
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
    toggleClock: (key) => setState((st) => ({ ...st, clockDone: { ...st.clockDone, [key]: !st.clockDone[key] } })),
    moveSetlist: (index, dir) => {
      if (!live) return move<SetlistSong>("setlist", index, dir);
      const to = index + dir;
      if (to < 0 || to >= data.setlist.length) return;
      sync(() => moveSetlistAction(data.dateId, index, to));
    },
    moveVehicle: (index, dir) => {
      if (!live) return move<VehicleLoad>("vehicles", index, dir);
      const to = index + dir;
      if (to < 0 || to >= data.vehicles.length) return;
      sync(() => moveVehicleAction(data.dateId, index, to));
    },
    adoptRider: () => setState((st) => ({ ...st, adopted: true })),
    adoptDocument: (dateId, documentId) => sync(() => adoptDocumentAction(dateId, documentId)),
    dismissReminder: (index) => {
      if (live) {
        const id = data.reminders[index]?.id;
        if (id) sync(() => dismissReminderAction(data.dateId, id));
        return;
      }
      setState((st) => ({ ...st, reminders: st.reminders.filter((_, i) => i !== index) }));
    },
    addReminder: (r) => {
      if (live) return sync(() => addReminderAction(data.dateId, r.at, r.message));
      setState((st) => ({ ...st, reminders: st.reminders.concat([r]).sort((a, b) => a.at.localeCompare(b.at)) }));
    },
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
          notas: [{ origen, body, meta: t("demo.youNotified") }].concat(st.notas),
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
            [dateId]: [{ body, meta: t("demo.you") }].concat(st.extraVenueNotes[dateId] || []),
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
            { name: t("demo.newVenueDoc"), kind: "pdf", meta: t("demo.uploadedByYou"), status: "nuevo" },
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
            [dateId]: [{ body, meta: t("demo.youStage") }].concat(
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
            { name: t("demo.newShowDoc"), kind: "pdf", meta: t("demo.uploadedByYou"), status: "nuevo" },
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
              { name, by: t("demo.addedByYou"), status: "pending" },
            ]),
          },
        };
      });
    },
    setGuestStatus: (dateId, index, status) => {
      if (live) {
        const guest = data.guestsByDate[dateId]?.[index];
        if (!guest?.id || guest.status === status) return;
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
              message:
                res.status === 404
                  ? t("sync.guestStatusAdminOnly")
                  : typeof error === "string"
                    ? error
                    : t("sync.guestStatusFailed"),
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
          [dateId]: (st.guestsByDate[dateId] || []).map((g, i) => (i === index ? { ...g, status } : g)),
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
          className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-sm z-50 tag tag-accent-2 flex items-center justify-between gap-3 px-4 py-3 shadow-lg"
        >
          <span>{state.syncError}</span>
          <button type="button" className="font-semibold" onClick={() => setState((st) => ({ ...st, syncError: null }))}>
            {t("sync.close")}
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

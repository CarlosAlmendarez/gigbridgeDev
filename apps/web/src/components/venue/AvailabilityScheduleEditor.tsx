"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import type { VenueAvailabilityBlockRow } from "@gigbridge/types";

interface Props {
  venueId: string;
}

interface AddFormState {
  day: number;
  start_time: string;
  end_time: string;
  block_type: "available" | "blocked";
  notes: string;
}

export function AvailabilityScheduleEditor({ venueId }: Props) {
  const t = useTranslations("venue_wizard");
  const DAYS = [t("avDay0"), t("avDay1"), t("avDay2"), t("avDay3"), t("avDay4"), t("avDay5"), t("avDay6")];
  const [blocks, setBlocks] = useState<VenueAvailabilityBlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [form, setForm] = useState<AddFormState>({ day: 0, start_time: "09:00", end_time: "22:00", block_type: "available", notes: "" });
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/venues/availability?venueId=${venueId}`)
      .then((r) => r.json())
      .then((d: { blocks?: VenueAvailabilityBlockRow[] }) => setBlocks(d.blocks ?? []))
      .finally(() => setLoading(false));
  }, [venueId]);

  function blocksByDay(day: number) {
    return blocks.filter((b) => b.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  function openAddForm(day: number) {
    setAddingDay(day);
    setForm((p) => ({ ...p, day }));
    setFormError(null);
  }

  function handleAdd() {
    if (form.start_time >= form.end_time) {
      setFormError(t("avTimeError"));
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const res = await fetch("/api/venues/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          day_of_week: form.day,
          start_time: form.start_time,
          end_time: form.end_time,
          block_type: form.block_type,
          notes: form.notes || undefined,
        }),
      });
      const json = (await res.json()) as { block?: VenueAvailabilityBlockRow; error?: string };
      if (!res.ok || !json.block) {
        setFormError(json.error ?? t("wizErrorSave"));
        return;
      }
      setBlocks((prev) => [...prev, json.block!]);
      setAddingDay(null);
    });
  }

  function handleDelete(blockId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/venues/availability?blockId=${blockId}`, { method: "DELETE" });
      if (res.ok) setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon name="circle-notch" size={20} className="animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {DAYS.map((dayName, dayIndex) => {
        const dayBlocks = blocksByDay(dayIndex);
        const isAdding = addingDay === dayIndex;
        return (
          <div key={dayIndex} className="overflow-hidden rounded-md border border-divider">
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-xs font-bold">{dayName}</span>
              <button
                type="button"
                onClick={() => (isAdding ? setAddingDay(null) : openAddForm(dayIndex))}
                className={["flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold", isAdding ? "text-neutral-600" : "text-accent-800"].join(" ")}
              >
                {isAdding ? (
                  t("avCancel")
                ) : (
                  <>
                    <Icon name="plus" size={11} /> {t("avAdd")}
                  </>
                )}
              </button>
            </div>

            {dayBlocks.map((b) => (
              <div key={b.id} className="flex items-center gap-2 border-t border-divider px-3 py-2">
                <span
                  className={[
                    "flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold",
                    b.block_type === "available" ? "border-accent-border bg-accent-100 text-accent-800" : "border-divider bg-surface text-neutral-600",
                  ].join(" ")}
                >
                  {b.block_type === "available" ? t("avAvailable") : t("avNotAvailable")}
                </span>
                <span className="flex-1 font-mono text-xs text-neutral-700">
                  {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                </span>
                {b.notes && <span className="max-w-[6rem] truncate text-[10px] text-neutral-500">{b.notes}</span>}
                <button type="button" onClick={() => handleDelete(b.id)} disabled={isPending} className="flex-shrink-0 text-neutral-500">
                  <Icon name="x-circle" size={14} />
                </button>
              </div>
            ))}

            {isAdding && (
              <div className="flex flex-col gap-2.5 border-t border-divider p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select value={form.block_type} onChange={(e) => setForm((p) => ({ ...p, block_type: e.target.value as "available" | "blocked" }))} className="input py-1.5 text-xs">
                    <option value="available">{t("avAvailable")}</option>
                    <option value="blocked">{t("avNotAvailable")}</option>
                  </select>
                  <input type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} className="input py-1.5 text-xs" />
                  <span className="text-xs text-neutral-600">{t("avTo")}</span>
                  <input type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} className="input py-1.5 text-xs" />
                </div>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder={t("avNotesPh")}
                  className="input py-1.5 text-xs"
                />
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                <button type="button" onClick={handleAdd} disabled={isPending} className="btn btn-primary w-fit py-1 text-xs">
                  {isPending ? t("avSaving") : t("avSave")}
                </button>
              </div>
            )}

            {!isAdding && dayBlocks.length === 0 && (
              <div className="border-t border-divider px-3 py-2">
                <span className="text-[10px] text-neutral-500">{t("avNoSchedule")}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

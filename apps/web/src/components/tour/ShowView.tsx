"use client";

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { mapFiles } from "@gigbridge/data";
import type { Locale } from "@gigbridge/config";
import type { TourDate } from "@gigbridge/types";
import { FileList, UploadButton } from "./FileList";

export function ShowView({ dateId, tourDate: d }: { dateId: string; tourDate: TourDate }) {
  const {
    source,
    setlist,
    moveSetlist,
    extraShowFiles,
    extraShowNotes,
    showNoteDraft,
    setShowNoteDraft,
    addShowNote,
    addShowFile,
  } = useTourUI();
  const t = useTranslations("tour");
  const locale = useLocale() as Locale;

  const showFiles = mapFiles(d.show.docs.concat(extraShowFiles[dateId] || []), locale);
  const showNotes = (extraShowNotes[dateId] || []).concat(d.show.notes);
  const docsCount = d.show.docs.length + (extraShowFiles[dateId] || []).length;
  const docsMeta = t("show.docsCount", { count: docsCount });
  const live = source === "supabase";

  return (
    <div className="pt-6">
      <div className="text-xs tracking-[0.1em] uppercase text-neutral-700">{d.show.kicker}</div>
      <h1 className="text-[48px] my-1 mb-4 tracking-[-0.03em]">{t("show.title")}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 max-w-[760px]">
        {d.show.headline.map((h, i) => (
          <div key={i}>
            <div className="font-heading font-semibold text-[34px] leading-none tabular-nums">{h.value}</div>
            <div className="text-[13px] text-neutral-700 mt-1">{h.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-8 pt-8">
        <div className="min-w-0">
          <h6 className="mb-3">{t("show.montaje")}</h6>
          {d.show.montaje.length === 0 ? (
            <p className="text-sm text-neutral-700">{t("show.montajeEmpty")}</p>
          ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t("show.colTime")}</th>
                <th>{t("show.colTask")}</th>
                <th>{t("show.colArea")}</th>
              </tr>
            </thead>
            <tbody>
              {d.show.montaje.map((m, i) => (
                <tr key={i}>
                  <td className="tabular-nums whitespace-nowrap">{m.time}</td>
                  <td>{m.task}</td>
                  <td className="text-neutral-700">{m.area}</td>
                </tr>
              ))}
            </tbody>
          </table>
          )}

          <div className="pt-8">
            <div className="flex items-baseline gap-2 mb-1">
              <h6 className="m-0 mr-auto">{t("show.setlist")}</h6>
              <span className="text-xs text-neutral-700">
                {t("show.songs", { count: setlist.length })}
              </span>
            </div>
            <p className="text-xs text-neutral-700 mb-3">
              {setlist.length === 0
                ? t("show.setlistEmpty")
                : t("show.setlistHelp") + (live ? ` ${t("show.setlistAdminOnly")}` : "")}
            </p>
            {setlist.map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-[5px]">
                <span className="w-[26px] tabular-nums text-[13px] text-neutral-700">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-base">{s.title}</div>
                  <div className="text-xs text-neutral-700">{s.cue}</div>
                </div>
                <span className="flex-none text-xs text-neutral-700 tabular-nums">{s.len}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon flex-none w-9 h-9 disabled:opacity-40"
                  onClick={() => moveSetlist(i, -1)}
                  disabled={i === 0}
                  aria-label={t("common.moveUp", { name: s.title })}
                >
                  <Icon name="arrow-up" size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon flex-none w-9 h-9 disabled:opacity-40"
                  onClick={() => moveSetlist(i, 1)}
                  disabled={i === setlist.length - 1}
                  aria-label={t("common.moveDown", { name: s.title })}
                >
                  <Icon name="arrow-down" size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h6 className="m-0 mr-auto">{t("show.docs")}</h6>
            <span className="text-xs text-neutral-700">{docsMeta}</span>
          </div>
          {showFiles.length === 0 && (
            <p className="text-sm text-neutral-700 mb-2">{t("show.docsEmpty")}</p>
          )}
          <FileList files={showFiles} />
          <UploadButton live={live} label={t("show.upload")} onUpload={() => addShowFile(dateId)} />

          <div className="pt-6">
            <h6 className="mb-1">{t("show.notes")}</h6>
            <p className="text-xs text-neutral-700 mb-2">{t("show.notesHelp")}</p>
            {showNotes.length === 0 && <p className="text-sm text-neutral-700">{t("common.noNotes")}</p>}
            {showNotes.map((n, i) => (
              <div key={i} className="py-2">
                <div className="text-sm leading-[1.5]">{n.body}</div>
                <div className="text-xs text-neutral-700 mt-0.5">{n.meta}</div>
              </div>
            ))}
            <form
              className="flex gap-2 mt-2"
              onSubmit={(e) => {
                e.preventDefault();
                addShowNote(dateId);
              }}
            >
              <input
                className="input min-h-[42px]"
                type="text"
                placeholder={t("show.notePlaceholder")}
                aria-label={t("show.noteLabel")}
                value={showNoteDraft}
                onChange={(e) => setShowNoteDraft(e.target.value)}
              />
              <button type="submit" className="btn btn-primary min-h-[42px] min-w-[42px]" aria-label={t("common.addNote")}>
                <Icon name="plus" size={17} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

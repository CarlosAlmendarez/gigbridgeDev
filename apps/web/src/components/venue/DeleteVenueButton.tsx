"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";

export function DeleteVenueButton({ venueId, venueName }: { venueId: string; venueName: string }) {
  const t = useTranslations("venue");
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const matches = confirm.toLowerCase() === venueName.toLowerCase();

  async function handleDelete() {
    if (!matches) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/venues/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t("dvb_errorDelete"));
        setLoading(false);
        return;
      }
      router.push("/dashboard/venue");
      router.refresh();
    } catch {
      setError(t("dvb_errorConnection"));
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-left text-red-600"
      >
        <Icon name="warning-circle" size={16} />
        <span className="text-sm">{t("dvb_delete")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="card elev-lg flex w-full max-w-md flex-col gap-5 border-red-300 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-red-300 bg-red-50">
                  <Icon name="warning-circle" size={18} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold">{t("dvb_title")}</h2>
                  <p className="text-xs text-neutral-600">{t("dvb_irreversible")}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-neutral-500">
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-neutral-700">
              {t("dvb_willDelete")}
              <ul className="mt-2 list-inside list-disc text-neutral-600">
                <li>{t("dvb_techProfile")}</li>
                <li>{t("dvb_verificationRequests")}</li>
                <li>{t("dvb_associatedImages")}</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-neutral-600">{t("dvb_confirmLabel", { name: venueName })}</label>
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={venueName}
                className={["input", matches ? "border-red-400" : ""].join(" ")}
                autoFocus
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setOpen(false);
                  setConfirm("");
                  setError("");
                }}
                className="btn btn-secondary flex-1"
              >
                {t("dvb_cancel")}
              </button>
              <button onClick={handleDelete} disabled={!matches || loading} className="btn flex-1 border border-red-400 text-red-600 disabled:opacity-40">
                {loading ? t("dvb_deleting") : t("dvb_delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

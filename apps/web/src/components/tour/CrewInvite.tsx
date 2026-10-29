"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { addCrewMemberAction } from "@/lib/actions/tour";
import type { TourMemberRoleInput } from "@gigbridge/data";

/**
 * Invitaciones del crew (0017), solo para admins con datos reales: el enlace
 * sale del Route Handler /api/v1/tour-crew/:id/invite, que también lo manda
 * por correo (Resend) si se pide.
 */

async function requestInvite(tourCrewId: string, send: boolean) {
  const res = await fetch(`/api/v1/tour-crew/${tourCrewId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ send }),
  });
  return (await res.json().catch(() => ({}))) as { url?: string; emailed?: boolean; warning?: string; error?: string };
}

/** Enlace de invitación de una persona: generar, copiar y (si tiene correo) mandar. */
export function InvitePanel({ tourCrewId, name, email, initialUrl }: { tourCrewId: string; name: string; email: string; initialUrl?: string }) {
  const t = useTranslations("tour.equipo");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const run = (send: boolean) =>
    start(async () => {
      const r = await requestInvite(tourCrewId, send);
      if (r.url) setUrl(r.url);
      setNote(r.error ?? r.warning ?? (r.emailed ? t("emailSent") : ""));
    });

  if (!url) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-neutral-700 m-0">{t("inviteNoAccount")}</p>
        <button type="button" className="btn btn-secondary min-h-10 self-start" onClick={() => run(false)} disabled={pending}>
          <Icon name="envelope-simple" size={16} />
          {t("invite")}
        </button>
        {note && <p className="text-xs text-accent-2-700 m-0">{note}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border border-divider rounded-md p-3">
      <div className="text-sm font-semibold">{t("inviteTitle", { name })}</div>
      <input className="input min-h-10 text-xs" readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label={t("inviteTitle", { name })} />
      <p className="text-xs text-neutral-700 m-0">{t("inviteHelp")}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary min-h-10"
          onClick={async () => {
            await navigator.clipboard?.writeText(url).catch(() => {});
            setNote(t("copied"));
          }}
        >
          {t("copyLink")}
        </button>
        {email && (
          <button type="button" className="btn btn-secondary min-h-10" onClick={() => run(true)} disabled={pending}>
            {t("sendEmail", { email })}
          </button>
        )}
      </div>
      {note && <p className="text-xs text-neutral-700 m-0">{note}</p>}
    </div>
  );
}

const ACCESS: TourMemberRoleInput[] = ["member", "dept_head", "guest", "admin"];

/** Alta de una persona en el roster y su enlace de invitación. */
export function AddPersonDialog({
  dateId,
  roles,
  onClose,
}: {
  dateId: string;
  roles: Array<{ id: string; name: string; department: string }>;
  onClose: () => void;
}) {
  const t = useTranslations("tour");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ tourCrewId: string; name: string; email: string; url: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-person-title"
        className="card elev-md w-full max-w-[520px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <div id="add-person-title" className="card-title mr-auto">
            {t("equipo.addPerson")}
          </div>
          <button type="button" className="btn btn-ghost min-h-10" onClick={onClose} aria-label={t("sync.close")}>
            <Icon name="x" size={16} />
          </button>
        </div>
        {created ? (
          <InvitePanel tourCrewId={created.tourCrewId} name={created.name} email={created.email} initialUrl={created.url} />
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const input = {
                name: String(fd.get("name") ?? ""),
                email: String(fd.get("email") ?? ""),
                phone: String(fd.get("phone") ?? ""),
                roleId: String(fd.get("roleId") ?? ""),
                memberRole: String(fd.get("memberRole") ?? "member") as TourMemberRoleInput,
                party: String(fd.get("party") ?? ""),
              };
              start(async () => {
                const res = await addCrewMemberAction(dateId, input);
                if (!res.ok) return setError(res.message);
                setCreated({
                  tourCrewId: res.result.tourCrewId,
                  name: input.name.trim(),
                  email: input.email.trim(),
                  url: `${window.location.origin}/invite/${res.result.token}`,
                });
              });
            }}
          >
            <p className="card-body m-0">{t("equipo.addPersonHelp")}</p>
            <label className="text-xs text-neutral-700 flex flex-col gap-1">
              {t("equipo.personName")}
              <input className="input min-h-10" name="name" required />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-neutral-700 flex flex-col gap-1">
                {t("equipo.personEmail")}
                <input className="input min-h-10" name="email" type="email" />
              </label>
              <label className="text-xs text-neutral-700 flex flex-col gap-1">
                {t("equipo.personPhone")}
                <input className="input min-h-10" name="phone" type="tel" />
              </label>
            </div>
            <label className="text-xs text-neutral-700 flex flex-col gap-1">
              {t("equipo.personRole")}
              <select className="input min-h-10" name="roleId" defaultValue="">
                <option value="">{t("equipo.noRole")}</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.department ? `${r.name} · ${r.department}` : r.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-neutral-700 flex flex-col gap-1">
                {t("equipo.personAccess")}
                <select className="input min-h-10" name="memberRole" defaultValue="member">
                  {ACCESS.map((a) => (
                    <option key={a} value={a}>
                      {t(`dia.role_${a}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-neutral-700 flex flex-col gap-1">
                {t("equipo.personParty")}
                <select className="input min-h-10" name="party" defaultValue="">
                  <option value="">{t("equipo.noParty")}</option>
                  {(["A", "B", "C"] as const).map((k) => (
                    <option key={k} value={k}>
                      {t(`parties.${k}.name`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error && (
              <p role="alert" className="text-sm text-accent-2-700 m-0">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary min-h-11 self-start" disabled={pending}>
              {pending ? t("equipo.adding") : t("equipo.addSubmit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

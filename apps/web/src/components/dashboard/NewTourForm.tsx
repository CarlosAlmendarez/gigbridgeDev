"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createTourAction } from "@/lib/actions/tour";

/** Alta de gira para el rol manager: nombre y primera fecha; al crearla abre su hoja del día. */
export function NewTourForm() {
  const t = useTranslations("dashboard");
  const [state, action, pending] = useActionState(createTourAction, null);

  return (
    <form action={action} className="card flex flex-col gap-3 p-4">
      <label className="flex flex-col gap-1 text-sm">
        {t("newTourName")}
        <input className="input min-h-11" type="text" name="name" placeholder={t("newTourNamePlaceholder")} required />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("newTourStart")}
        <input className="input min-h-11" type="date" name="startDate" required />
      </label>
      {state?.message && (
        <p role="alert" className="text-sm text-accent-2-700">
          {state.message}
        </p>
      )}
      <button type="submit" className="btn btn-primary min-h-11 self-start" disabled={pending}>
        {pending ? t("newTourCreating") : t("newTourSubmit")}
      </button>
    </form>
  );
}

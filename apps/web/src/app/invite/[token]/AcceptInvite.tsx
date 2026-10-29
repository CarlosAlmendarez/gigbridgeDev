"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { acceptInviteAction } from "@/lib/actions/invite";

export function AcceptInvite({ token }: { token: string }) {
  const t = useTranslations("tour.invite");
  const [state, action, pending] = useActionState(acceptInviteAction.bind(null, token), null);
  return (
    <form action={action} className="flex flex-col gap-2">
      {state?.message && (
        <p role="alert" className="text-sm text-accent-2-700">
          {state.message}
        </p>
      )}
      <button type="submit" className="btn btn-primary min-h-11 self-start" disabled={pending}>
        {pending ? t("accepting") : t("accept")}
      </button>
    </form>
  );
}

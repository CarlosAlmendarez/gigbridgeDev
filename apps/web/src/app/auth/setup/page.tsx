"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AuthStandaloneCard } from "@/components/auth/AuthStandaloneCard";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { SlugField } from "@/components/auth/SlugField";
import type { UserRole } from "@gigbridge/types";

export default function SetupPage() {
  const [slugValue, setSlugValue] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const router = useRouter();
  const t = useTranslations("auth");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (slugAvailable === false) return;
    if (!selectedRole) {
      setError(t("selectRole"));
      return;
    }
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const res = await fetch("/api/setup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: formData.get("display_name"),
          role: formData.get("role"),
          slug: formData.get("slug"),
        }),
      });

      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <AuthStandaloneCard subtitle={t("setupProfileTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("artisticName")}</label>
          <input name="display_name" type="text" placeholder="La Banda Perfecta" required className="input" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">{t("iAmSetup")}</label>
          <RoleSelector value={selectedRole} onChange={setSelectedRole} />
        </div>

        <SlugField value={slugValue} onChange={setSlugValue} onAvailabilityChange={setSlugAvailable} />

        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <button type="submit" disabled={isPending || slugAvailable === false || !selectedRole} className="btn btn-primary btn-block">
          {isPending ? t("creatingProfile") : t("createProfileBtn")}
        </button>
      </form>
    </AuthStandaloneCard>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/Icon";

export const metadata = { title: "GigBridge — No autorizado" };

/**
 * Versión recortada del 401 de v1: allá vivía dentro de un componente
 * genérico de 5 códigos de error con su propio CSS module y animaciones
 * (`ErrorPageUI`/`error-page.module.css`) — aquí solo se porta el 401,
 * que es el único con enlaces directos a auth; 403/503 se agregan cuando
 * haya algo que los dispare.
 */
export default async function Unauthorized() {
  const t = await getTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-800">
        {t("e401PrivateZone")}
      </div>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-accent-border bg-accent-100">
        <Icon name="lock-key" size={24} className="text-accent-800" />
      </div>
      <h1 className="mb-2 font-heading text-2xl font-semibold">{t("e401Title")}</h1>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-neutral-700">{t("e401Body")}</p>

      <div className="flex gap-3">
        <Link href="/auth/login" className="btn btn-primary">
          {t("e401BtnLogin")}
        </Link>
        <Link href="/" className="btn btn-secondary">
          {t("e401BtnHome")}
        </Link>
      </div>

      <p className="mt-6 text-sm text-neutral-600">
        <Link href="/auth/register" className="text-accent-800">
          {t("e401Register")}
        </Link>
      </p>
    </div>
  );
}

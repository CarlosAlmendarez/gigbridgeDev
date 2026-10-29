"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/Icon";
import { useTourUI } from "@/context/TourUIContext";
import { BUCKETS } from "@gigbridge/config";
import { chipClass } from "@/lib/ui";
import type { Provider } from "@gigbridge/types";

export function ClubView({ providers: allProviders }: { providers: Provider[] }) {
  const { bucket, setBucket, filtro, setFiltro } = useTourUI();
  const t = useTranslations("tour");

  const bucketId = (BUCKETS.find((b) => b.id === bucket) ?? BUCKETS[0]).id;
  const bucketProviders = allProviders.filter((p) => p.bucket === bucket);
  const services = ["Todos", ...Array.from(new Set(bucketProviders.map((p) => p.service)))];
  const providers = bucketProviders.filter((p) => filtro === "Todos" || p.service === filtro);

  return (
    <div className="pt-6">
      <div className="text-xs tracking-[0.1em] uppercase text-neutral-700">{t("club.kicker")}</div>
      <h1 className="text-[40px] sm:text-[48px] my-1 mb-2 tracking-[-0.03em]">{t("club.title")}</h1>
      <p className="text-base max-w-[60ch]">
        {t("club.intro")}
      </p>

      {allProviders.length === 0 ? (
        <p className="text-sm text-neutral-700 pt-4 max-w-[60ch]">
          {t("club.empty")}
        </p>
      ) : (
        <>

      <div className="flex gap-1 flex-wrap pt-4 pb-2">
        {BUCKETS.map((b) => (
          <button key={b.id} type="button" onClick={() => setBucket(b.id)} className={chipClass(bucket === b.id)}>
            {t(`buckets.${b.id}.label`)}
          </button>
        ))}
      </div>
      <p className="text-[15px] text-neutral-700 max-w-[64ch] m-0">{t(`buckets.${bucketId}.help`)}</p>
      {providers.length === 0 && <p className="text-sm text-neutral-700 pt-3">{t("club.bucketEmpty")}</p>}
      <div className="flex gap-1 flex-wrap pt-3 pb-6">
        {services.map((f) => (
          <button key={f} type="button" onClick={() => setFiltro(f)} className={chipClass(filtro === f, true)}>
            {f === "Todos" ? t("club.allServices") : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 items-start">
        {providers.map((p, i) => {
          const contactable = p.bucket !== "vetado" && p.email !== "—";
          const tagClass =
            p.bucket === "vetado" ? "tag tag-accent-2" : p.bucket === "recinto" ? "tag tag-accent" : "tag tag-neutral";
          const tagLabel = t(`buckets.${p.bucket}.tag`);
          return (
            <div key={i}>
              <div className="flex items-center gap-2">
                <div className="font-heading font-semibold text-[19px] mr-auto">{p.name}</div>
                <span className={tagClass}>{tagLabel}</span>
              </div>
              <div className="text-xs tracking-[0.06em] uppercase text-neutral-700 my-0.5">
                {p.service} · {p.city}
              </div>
              <div className="text-sm">{p.contact}</div>
              <div className="text-[13px] break-words">{p.email === "—" ? t("club.noEmail") : p.email}</div>
              <div className="text-[13px] italic text-neutral-700 mt-[3px]">{p.note}</div>
              {contactable && (
                <div className="flex gap-2 mt-2">
                  <a className="btn btn-secondary min-h-10" href={`tel:${p.tel}`} aria-label={t("common.callTo", { name: p.name })}>
                    <Icon name="phone" size={17} />
                    {t("common.call")}
                  </a>
                  <a className="btn btn-secondary min-h-10" href={`mailto:${p.email}`}>
                    <Icon name="envelope-simple" size={17} />
                    {t("common.email")}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
        </>
      )}
    </div>
  );
}

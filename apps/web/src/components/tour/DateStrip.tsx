"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { dateChipClass } from "@/lib/ui";
import type { TourDate } from "@gigbridge/types";

export function DateStrip({ dates }: { dates: TourDate[] }) {
  const pathname = usePathname();
  const params = useParams<{ dateId: string }>();
  const dateId = params.dateId;
  const day = dates.find((d) => d.id === dateId) ?? dates[0];

  const segments = pathname.split("/");

  function hrefForDate(id: string) {
    const next = segments.slice();
    next[2] = id;
    return next.join("/");
  }

  return (
    <div className="sticky top-0 z-[4] bg-bg pt-4 pb-3">
      <div className="flex items-end gap-6">
        <div className="strip flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {dates.map((d) => (
            <Link key={d.id} href={hrefForDate(d.id)} className={dateChipClass(d.id === dateId)}>
              <span className="text-[11px] tracking-[0.08em] uppercase">{d.dow}</span>
              <span className="font-heading font-semibold text-2xl leading-none [font-variant-numeric:tabular-nums]">
                {d.day}
              </span>
              <span className="text-[10px] tracking-[0.06em] uppercase">{d.kind}</span>
            </Link>
          ))}
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs tracking-[0.1em] uppercase">{day.dateline}</div>
          <div className="text-xs tracking-[0.1em] uppercase text-accent-700">{day.counter}</div>
        </div>
      </div>
      <div className="h-1 bg-text mt-3" />
      <div className="h-px bg-text mt-[5px]" />
    </div>
  );
}

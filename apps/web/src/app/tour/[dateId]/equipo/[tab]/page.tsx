import { notFound } from "next/navigation";
import { EquipoView } from "@/components/tour/EquipoView";
import type { EquipoTabId } from "@gigbridge/types";
import { getTourRepository } from "@/lib/tourRepository";

const VALID_TABS: EquipoTabId[] = ["crew", "areas", "ubicaciones", "contactos", "invitados"];

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ dateId: string; tab: string }>;
}) {
  const { dateId, tab } = await params;
  if (!VALID_TABS.includes(tab as EquipoTabId)) notFound();

  const repo = await getTourRepository({ dateId });
  const [roster, vacancies, externalContacts, dates] = await Promise.all([
    repo.listRoster(),
    repo.listVacancies(),
    repo.listExternalContacts(),
    repo.listTourDates(),
  ]);

  return (
    <EquipoView
      dateId={dateId}
      tab={tab as EquipoTabId}
      roster={roster}
      vacancies={vacancies}
      externalContacts={externalContacts}
      dates={dates}
    />
  );
}

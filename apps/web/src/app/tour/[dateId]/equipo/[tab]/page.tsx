import { notFound } from "next/navigation";
import { listExternalContacts, listRoster, listTourDates, listVacancies } from "@gigbridge/data";
import { EquipoView } from "@/components/tour/EquipoView";
import type { EquipoTabId } from "@gigbridge/types";

const VALID_TABS: EquipoTabId[] = ["crew", "areas", "ubicaciones", "contactos", "invitados"];

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ dateId: string; tab: string }>;
}) {
  const { dateId, tab } = await params;
  if (!VALID_TABS.includes(tab as EquipoTabId)) notFound();

  const [roster, vacancies, externalContacts, dates] = await Promise.all([
    listRoster(),
    listVacancies(),
    listExternalContacts(),
    listTourDates(),
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

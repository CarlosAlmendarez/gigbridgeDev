import { notFound } from "next/navigation";
import { EquipoView } from "@/components/tour/EquipoView";
import type { EquipoTabId } from "@gigbridge/types";
import { listCrewRoles } from "@gigbridge/data";
import { getTourRepository, tourDataSource } from "@/lib/tourRepository";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const VALID_TABS: EquipoTabId[] = ["crew", "areas", "ubicaciones", "contactos", "invitados"];

export default async function EquipoPage({
  params,
}: {
  params: Promise<{ dateId: string; tab: string }>;
}) {
  const { dateId, tab } = await params;
  if (!VALID_TABS.includes(tab as EquipoTabId)) notFound();

  const repo = await getTourRepository({ dateId });
  const [roster, vacancies, externalContacts, dates, crewRoles] = await Promise.all([
    repo.listRoster(),
    repo.listVacancies(),
    repo.listExternalContacts(),
    repo.listTourDates(),
    tab === "crew" && tourDataSource() === "supabase" ? getSupabaseServerClient().then(listCrewRoles) : Promise.resolve([]),
  ]);

  return (
    <EquipoView
      dateId={dateId}
      tab={tab as EquipoTabId}
      roster={roster}
      vacancies={vacancies}
      externalContacts={externalContacts}
      dates={dates}
      crewRoles={crewRoles}
    />
  );
}

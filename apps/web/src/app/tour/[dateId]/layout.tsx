import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { clientMessages } from "@/lib/clientMessages";
import { TourUIProvider } from "@/context/TourUIContext";
import { Sidebar } from "@/components/tour/Sidebar";
import { DateStrip } from "@/components/tour/DateStrip";
import { getTourRepository, tourDataSource } from "@/lib/tourRepository";

// Vive bajo [dateId] (no en /tour) porque las rutas solo traen la fecha:
// de ella se resuelve a qué gira pertenecen el date strip y el roster.
export default async function TourLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ dateId: string }>;
}) {
  const { dateId } = await params;
  const repo = await getTourRepository({ dateId });
  const [messages, summary, dates, roster, guestsByDate, setlist, notas, vehicles, reminders] = await Promise.all([
    clientMessages(["tour"]),
    repo.getTourSummary(),
    repo.listTourDates(),
    repo.listRoster(),
    repo.listGuests(),
    repo.getSetlist(dateId),
    repo.listTourNotes(),
    repo.listVehicles(),
    repo.listMyReminders(dateId),
  ]);
  // Fecha inexistente o de una gira que la RLS no deja ver: 404 aquí, antes
  // de que la navegación intente pintarse con una gira vacía.
  if (!summary || !dates.some((d) => d.id === dateId)) notFound();

  return (
    <NextIntlClientProvider messages={messages}>
    <TourUIProvider data={{ source: tourDataSource(), dateId, guestsByDate, setlist, notas, summary, vehicles, reminders }}>
      <div className="min-h-screen bg-bg text-text font-body grid grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)]">
        <Sidebar roster={roster} />
        <div className="min-w-0 px-4 pb-8 md:px-0 md:pt-0 md:pr-8 md:pl-0">
          <DateStrip dates={dates} />
          {children}
        </div>
      </div>
    </TourUIProvider>
    </NextIntlClientProvider>
  );
}

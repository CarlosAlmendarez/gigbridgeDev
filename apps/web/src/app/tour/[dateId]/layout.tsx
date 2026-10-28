import { TourUIProvider } from "@/context/TourUIContext";
import { Sidebar } from "@/components/tour/Sidebar";
import { DateStrip } from "@/components/tour/DateStrip";
import { getTourRepository } from "@/lib/tourRepository";

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
  const [dates, roster] = await Promise.all([repo.listTourDates(), repo.listRoster()]);

  return (
    <TourUIProvider>
      <div className="min-h-screen bg-bg text-text font-body grid grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)]">
        <Sidebar roster={roster} />
        <div className="min-w-0 px-4 pb-8 md:px-0 md:pt-0 md:pr-8 md:pl-0">
          <DateStrip dates={dates} />
          {children}
        </div>
      </div>
    </TourUIProvider>
  );
}

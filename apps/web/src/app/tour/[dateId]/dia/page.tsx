import { notFound } from "next/navigation";
import { DiaView } from "@/components/tour/DiaView";
import { getTourRepository } from "@/lib/tourRepository";

export default async function DiaPage({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  const repo = await getTourRepository({ dateId });
  const [tourDate, roster] = await Promise.all([repo.getTourDate(dateId), repo.listRoster()]);
  if (!tourDate) notFound();
  return <DiaView dateId={dateId} tourDate={tourDate} roster={roster} />;
}

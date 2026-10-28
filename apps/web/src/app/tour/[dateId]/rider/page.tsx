import { notFound } from "next/navigation";
import { RiderView } from "@/components/tour/RiderView";
import { getTourRepository } from "@/lib/tourRepository";

export default async function RiderPage({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  const tourDate = await (await getTourRepository({ dateId })).getTourDate(dateId);
  if (!tourDate) notFound();
  return <RiderView dateId={dateId} tourDate={tourDate} />;
}

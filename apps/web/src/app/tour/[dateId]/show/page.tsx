import { notFound } from "next/navigation";
import { ShowView } from "@/components/tour/ShowView";
import { getTourRepository } from "@/lib/tourRepository";

export default async function ShowPage({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  const tourDate = await (await getTourRepository({ dateId })).getTourDate(dateId);
  if (!tourDate) notFound();
  return <ShowView dateId={dateId} tourDate={tourDate} />;
}

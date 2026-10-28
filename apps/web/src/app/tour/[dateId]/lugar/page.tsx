import { notFound } from "next/navigation";
import { LugarView } from "@/components/tour/LugarView";
import { getTourRepository } from "@/lib/tourRepository";

export default async function LugarPage({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  const tourDate = await (await getTourRepository({ dateId })).getTourDate(dateId);
  if (!tourDate) notFound();
  return <LugarView dateId={dateId} tourDate={tourDate} />;
}

import { getTourDate } from "@gigbridge/data";
import { LugarView } from "@/components/tour/LugarView";

export default async function LugarPage({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  const tourDate = await getTourDate(dateId);
  return <LugarView dateId={dateId} tourDate={tourDate} />;
}

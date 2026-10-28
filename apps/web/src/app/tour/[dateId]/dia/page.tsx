import { getTourDate, listRoster } from "@gigbridge/data";
import { DiaView } from "@/components/tour/DiaView";

export default async function DiaPage({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  const [tourDate, roster] = await Promise.all([getTourDate(dateId), listRoster()]);
  return <DiaView dateId={dateId} tourDate={tourDate} roster={roster} />;
}

import { getTourDate } from "@gigbridge/data";
import { ShowView } from "@/components/tour/ShowView";

export default async function ShowPage({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  const tourDate = await getTourDate(dateId);
  return <ShowView dateId={dateId} tourDate={tourDate} />;
}

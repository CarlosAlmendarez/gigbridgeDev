import { RiderView } from "@/components/tour/RiderView";

export default async function RiderPage({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  return <RiderView dateId={dateId} />;
}

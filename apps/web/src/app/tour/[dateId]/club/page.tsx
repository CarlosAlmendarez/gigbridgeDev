import { ClubView } from "@/components/tour/ClubView";
import { getTourRepository } from "@/lib/tourRepository";

export default async function ClubPage({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  const providers = await (await getTourRepository({ dateId })).listProviders();
  return <ClubView providers={providers} />;
}

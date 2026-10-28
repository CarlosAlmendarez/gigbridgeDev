import { listProviders } from "@gigbridge/data";
import { ClubView } from "@/components/tour/ClubView";

export default async function ClubPage() {
  const providers = await listProviders();
  return <ClubView providers={providers} />;
}

import { redirect } from "next/navigation";

export default async function EquipoIndexPage({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  redirect(`/tour/${dateId}/equipo/crew`);
}

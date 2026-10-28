import { redirect } from "next/navigation";
import { DEFAULT_DATE_ID, findOpeningTourDateId } from "@gigbridge/data";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { tourDataSource } from "@/lib/tourRepository";

export default async function Home() {
  if (tourDataSource() === "mock") redirect(`/tour/${DEFAULT_DATE_ID}/dia`);

  const today = new Date().toISOString().slice(0, 10);
  const dateId = await findOpeningTourDateId(await getSupabaseServerClient(), today);
  // Sin giras visibles todavía: el dashboard es donde se dan de alta.
  redirect(dateId ? `/tour/${dateId}/dia` : "/dashboard");
}

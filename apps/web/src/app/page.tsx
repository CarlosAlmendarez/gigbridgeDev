import { redirect } from "next/navigation";
import { DEFAULT_DATE_ID } from "@gigbridge/data";

export default function Home() {
  redirect(`/tour/${DEFAULT_DATE_ID}/dia`);
}

import { redirect } from "next/navigation";

/** The old Overview now lives on Home (feed): requests, your startup and the setup checklist. */
export default function DashboardPage() {
  redirect("/feed");
}

import { redirect } from "next/navigation";

export default function Page() {
  redirect("/admin/applications?type=investor");
}

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Short, shareable profile URL: /u/<handle> → canonical /founders/<id>. */
export default async function HandleRedirect({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!/^[A-Za-z0-9_]{3,30}$/.test(handle)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("public_founders").select("id").ilike("handle", handle).maybeSingle();
  if (!data?.id) notFound();
  redirect(`/founders/${data.id}`);
}

import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-controls";
import { Flash } from "@/components/app/flash";
import { setUserStatusRow } from "@/lib/actions/admin";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  const sp = await searchParams;
  const me = await requireSuperAdmin();
  const supabase = await createClient();
  const term = (sp.q ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 60);

  let q = supabase.from("profiles").select("id, full_name, role, verification_status, suspended_at, is_demo, created_at").order("created_at", { ascending: false }).limit(100);
  if (term) q = q.ilike("full_name", `%${term}%`);
  const { data: users } = await q;
  const { data: emails } = users?.length ? await supabase.rpc("admin_profile_emails", { p_ids: users.map((u) => u.id) }) : { data: [] };

  return (
    <>
      <PageHeader title="Users" description="Suspend, restore or revoke verification. Every action is audited and the user is notified." />
      <Flash error={sp.error} />
      <form className="mb-6 flex max-w-md gap-2" role="search">
        <Input name="q" placeholder="Search by name" defaultValue={sp.q ?? ""} aria-label="Search users" />
        <Button type="submit">Search</Button>
      </form>
      {users?.length ? (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id}><Card><CardContent className="space-y-3 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{u.full_name || "—"} {u.is_demo ? <Badge tone="warning">DEMO</Badge> : null}</p>
                  <p className="text-xs text-muted-foreground">{emails?.find((e) => e.id === u.id)?.email} · joined {formatDate(u.created_at)}</p>
                </div>
                <div className="flex gap-2"><Badge>{humanize(u.role)}</Badge><Badge tone={u.suspended_at ? "danger" : u.verification_status === "approved" ? "success" : "neutral"}>{humanize(u.verification_status)}</Badge></div>
              </div>
              {u.id !== me.id && u.role !== "super_admin" ? (
                <form action={setUserStatusRow} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <Input name="reason" placeholder="Reason (required to suspend / revoke)" aria-label="Reason" className="max-w-xs" />
                  <Select name="action" aria-label="Action" className="w-48" defaultValue={u.suspended_at ? "restore" : "suspend"}>
                    {u.suspended_at ? <option value="restore">Restore account</option> : <option value="suspend">Suspend account</option>}
                    {u.verification_status === "approved" && !u.suspended_at ? <option value="revoke_verification">Revoke verification</option> : null}
                    {u.verification_status === "approved" && u.role === "founder" ? <option value="make_moderator">Make moderator</option> : null}
                    {u.role === "moderator" ? <option value="remove_moderator">Remove moderator</option> : null}
                  </Select>
                  <Button type="submit" size="sm" variant="outline">Apply</Button>
                </form>
              ) : null}
            </CardContent></Card></li>
          ))}
        </ul>
      ) : <EmptyState title="No users found" />}
    </>
  );
}

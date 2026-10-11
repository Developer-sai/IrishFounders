import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit logs" };

export default async function AuditLogsPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: logs } = await supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  const ids = [...new Set((logs ?? []).flatMap((l) => (l.admin_id ? [l.admin_id] : [])))];
  const { data: admins } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };

  return (
    <>
      <PageHeader title="Audit logs" description="Append-only record of every administrative decision. Entries cannot be edited or deleted." />
      {logs?.length ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">When</th><th className="p-3">Admin</th><th className="p-3">Action</th><th className="p-3">Target</th><th className="p-3">Details</th></tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 align-top">
                  <td className="whitespace-nowrap p-3">{formatDate(l.created_at, true)}</td>
                  <td className="p-3">{admins?.find((a) => a.id === l.admin_id)?.full_name ?? "System"}</td>
                  <td className="p-3">{humanize(l.action)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{l.target_table}<br />{l.target_id}</td>
                  <td className="max-w-xs break-words p-3 text-xs text-muted-foreground">{JSON.stringify(l.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No administrative actions yet" />}
    </>
  );
}

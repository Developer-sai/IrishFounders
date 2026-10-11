import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { Flash } from "@/components/app/flash";
import { updateSettingRow } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Platform settings" };

const LABELS: Record<string, string> = {
  applications_open: "Applications open",
  min_company_followers: "Minimum company LinkedIn followers",
  min_company_posts: "Minimum company LinkedIn posts",
};

export default async function SettingsAdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("platform_settings").select("key, value").order("key");
  return (
    <div className="max-w-xl">
      <PageHeader title="Platform settings" />
      <Flash error={error} />
      <div className="space-y-3">
        {(data ?? []).map((s) => (
          <Card key={s.key}><CardContent className="py-4">
            <form action={updateSettingRow} className="flex flex-wrap items-center justify-between gap-3">
              <input type="hidden" name="key" value={s.key} />
              <label htmlFor={s.key} className="text-sm font-medium">{LABELS[s.key] ?? s.key}</label>
              <div className="flex gap-2">
                {typeof s.value === "boolean" ? (
                  <select id={s.key} name="value" defaultValue={String(s.value)} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
                    <option value="true">Yes</option><option value="false">No</option>
                  </select>
                ) : (
                  <Input id={s.key} name="value" type="number" min={0} defaultValue={String(s.value)} className="w-28" />
                )}
                <Button type="submit" size="sm" variant="outline">Save</Button>
              </div>
            </form>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

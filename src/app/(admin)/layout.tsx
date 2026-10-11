import { requireAdmin } from "@/lib/auth";
import { ADMIN_NAV, AppShell } from "@/components/app/app-shell";

const MODERATOR_PATHS = new Set(["/admin", "/admin/moderation", "/admin/opportunities"]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const nav = session.role === "super_admin" ? ADMIN_NAV : ADMIN_NAV.filter((n) => MODERATOR_PATHS.has(n.href));
  return (
    <AppShell nav={nav} session={session} area="Admin">
      {children}
    </AppShell>
  );
}

import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell, INVESTOR_NAV, MEMBER_NAV } from "@/components/app/app-shell";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await requireMember();
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.id)
    .eq("is_read", false);
  const isInvestor = session.role === "investor";
  return (
    <AppShell
      nav={isInvestor ? INVESTOR_NAV : MEMBER_NAV}
      session={session}
      unread={count ?? 0}
      area={isInvestor ? "Investor" : "Member"}
    >
      {children}
    </AppShell>
  );
}

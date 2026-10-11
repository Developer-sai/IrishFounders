import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell, INVESTOR_MORE, INVESTOR_PRIMARY, MEMBER_MORE, MEMBER_PRIMARY } from "@/components/app/app-shell";

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
      nav={isInvestor ? INVESTOR_PRIMARY : MEMBER_PRIMARY}
      more={isInvestor ? INVESTOR_MORE : MEMBER_MORE}
      session={session}
      unread={count ?? 0}
      area={isInvestor ? "Investor" : "Member"}
      isFounder={session.role === "founder"}
      social
    >
      {children}
    </AppShell>
  );
}

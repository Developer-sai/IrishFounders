import Link from "next/link";
import {
  Bell, Bookmark, Briefcase, Compass, Handshake, Home, LayoutDashboard, MessageSquare, Newspaper,
  Rocket, Search, Settings, Shield, Users, FlaskConical, Building2, ScrollText, Flag, UserCog, ClipboardCheck,
  CalendarClock, Landmark,
} from "lucide-react";
import { Logo } from "@/components/marketing/site-header";
import { Avatar } from "@/components/ui/card";
import { signOut } from "@/lib/actions/auth";
import type { SessionProfile } from "@/lib/auth";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export const MEMBER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/startup", label: "My Startup", icon: Building2 },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/feed", label: "Community Feed", icon: Newspaper },
  { href: "/launches", label: "Product Launches", icon: Rocket },
  { href: "/design-partners", label: "Design Partners", icon: FlaskConical },
  { href: "/collaborate", label: "Collaborate", icon: Users },
  { href: "/investors", label: "Investors", icon: Landmark },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const INVESTOR_NAV: NavItem[] = [
  { href: "/investor/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/investor/discover", label: "Discover Startups", icon: Search },
  { href: "/investor/saved", label: "Saved Startups", icon: Bookmark },
  { href: "/investor/introductions", label: "Founder Introductions", icon: Handshake },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/investor/profile", label: "Profile", icon: UserCog },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: ClipboardCheck },
  { href: "/admin/interviews", label: "Interviews", icon: CalendarClock },
  { href: "/admin/startups", label: "Startups & Claims", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: UserCog },
  { href: "/admin/moderation", label: "Moderation", icon: Flag },
  { href: "/admin/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/settings", label: "Platform Settings", icon: Shield },
];

export function AppShell({
  nav, session, unread = 0, area, children,
}: {
  nav: NavItem[]; session: SessionProfile; unread?: number; area: string; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_1fr]">
      <aside className="bg-sidebar text-[hsl(41_30%_93%)] md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-y-auto">
        <div className="flex h-16 items-center justify-between px-5 [&_a]:text-[hsl(41_30%_93%)]">
          <Logo />
        </div>
        <p className="px-5 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(41_30%_93%/0.45)]">{area}</p>
        <nav aria-label={`${area} navigation`} className="flex gap-0.5 overflow-x-auto px-3 pb-3 md:block md:flex-1 md:space-y-px md:overflow-visible">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="group flex shrink-0 items-center gap-3 rounded-sm px-3 py-2 text-[13px] text-[hsl(41_30%_93%/0.68)] transition-colors hover:bg-[hsl(41_30%_93%/0.08)] hover:text-[hsl(41_30%_93%)] focus-visible:ring-offset-sidebar">
              <Icon className="h-4 w-4 opacity-70 group-hover:opacity-100" aria-hidden />
              <span>{label}</span>
              {href === "/notifications" && unread > 0 ? (
                <span className="ml-auto rounded-sm bg-accent px-1.5 font-mono text-[10px] font-semibold text-white" aria-label={`${unread} unread`}>{unread}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-[hsl(41_30%_93%/0.12)] p-4 md:block">
          <div className="flex items-center gap-3">
            <Avatar name={session.full_name} src={session.avatar_url} size={32} />
            <div className="min-w-0">
              <p className="truncate text-sm">{session.full_name}</p>
              <p className="truncate font-mono text-[10px] text-[hsl(41_30%_93%/0.5)]">{session.email}</p>
            </div>
          </div>
          <form action={signOut} className="mt-3">
            <button type="submit" className="w-full rounded-sm border border-[hsl(41_30%_93%/0.25)] py-1.5 text-[13px] text-[hsl(41_30%_93%/0.85)] transition-colors hover:border-[hsl(41_30%_93%/0.6)] hover:text-white">Sign out</button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-5 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-[1040px]">{children}</div>
      </main>
    </div>
  );
}

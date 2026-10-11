import Link from "next/link";
import {
  Bell, Bookmark, Briefcase, Compass, Handshake, Home, LayoutDashboard, MessageSquare, Newspaper,
  Rocket, Search, Settings, Shield, Users, FlaskConical, Building2, ScrollText, Flag, UserCog, ClipboardCheck,
  CalendarClock, Landmark,
} from "lucide-react";
import { Logo } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-card md:sticky md:top-0 md:h-screen md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="flex h-16 items-center justify-between px-4">
          <Logo />
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{area}</span>
        </div>
        <nav aria-label={`${area} navigation`} className="flex gap-1 overflow-x-auto px-2 pb-3 md:block md:space-y-0.5 md:overflow-visible">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <Icon className="h-4 w-4" aria-hidden />
              <span>{label}</span>
              {href === "/notifications" && unread > 0 ? (
                <span className="ml-auto rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white" aria-label={`${unread} unread`}>{unread}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-border p-4 md:block">
          <div className="flex items-center gap-3">
            <Avatar name={session.full_name} src={session.avatar_url} size={32} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{session.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{session.email}</p>
            </div>
          </div>
          <form action={signOut} className="mt-3"><Button type="submit" variant="outline" size="sm" className="w-full">Sign out</Button></form>
        </div>
      </aside>
      <main id="main" className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}

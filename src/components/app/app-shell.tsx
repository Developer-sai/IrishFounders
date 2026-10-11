import Link from "next/link";
import {
  Bell, Bookmark, Briefcase, Handshake, LayoutDashboard, MessageSquare, Newspaper,
  Rocket, Search, Settings, Shield, Users, FlaskConical, Building2, ScrollText, Flag, UserCog, ClipboardCheck,
  CalendarClock, Landmark, Home, Sparkles,
} from "lucide-react";
import { Logo } from "@/components/marketing/site-header";
import { Avatar } from "@/components/ui/card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { CommandPalette } from "@/components/ui/command-palette";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut } from "@/lib/actions/auth";
import type { SessionProfile } from "@/lib/auth";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export const MEMBER_NAV: NavItem[] = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Sparkles },
  { href: "/launches", label: "Launch Day", icon: Rocket },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/startup", label: "My Startup", icon: Building2 },
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
  { href: "/feed", label: "Community", icon: Newspaper },
  { href: "/launches", label: "Launch Day", icon: Rocket },
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
  nav, session, unread = 0, area, children, social = false,
}: {
  nav: NavItem[]; session: SessionProfile; unread?: number; area: string; children: React.ReactNode;
  /** Show the mobile bottom tab bar (member workspace). */
  social?: boolean;
}) {
  const paletteLinks = nav.map((n) => ({ href: n.href, label: n.label }));
  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_1fr]">
      {/* ---------------- desktop sidebar */}
      <aside className="hidden bg-sidebar text-[hsl(41_30%_93%)] md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-y-auto">
        <div className="flex h-16 items-center justify-between px-5 [&_a]:text-[hsl(41_30%_93%)]">
          <Logo />
        </div>
        <p className="px-5 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(41_30%_93%/0.45)]">{area}</p>
        <nav aria-label={`${area} navigation`} className="flex-1 space-y-px px-3 pb-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="group flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] text-[hsl(41_30%_93%/0.68)] transition-colors hover:bg-[hsl(41_30%_93%/0.08)] hover:text-[hsl(41_30%_93%)] focus-visible:ring-offset-sidebar">
              <Icon className="h-4 w-4 opacity-70 group-hover:opacity-100" aria-hidden />
              <span>{label}</span>
              {href === "/notifications" && unread > 0 ? (
                <span className="ml-auto rounded-sm bg-accent px-1.5 font-mono text-[10px] font-semibold text-white" aria-label={`${unread} unread`}>{unread}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[hsl(41_30%_93%/0.12)] p-4">
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

      <div className="min-w-0">
        {/* ---------------- top bar: search + theme (desktop) / logo + search (mobile) */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:justify-end md:px-10">
          <div className="md:hidden"><Logo /></div>
          <div className="flex items-center gap-2">
            <CommandPalette links={paletteLinks} />
            <ThemeToggle />
            <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-muted/70 md:hidden">
              <Bell className="h-4 w-4" aria-hidden />
              {unread > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" /> : null}
            </Link>
          </div>
        </div>
        <main id="main" className={`px-4 py-8 md:px-10 md:py-10 ${social ? "pb-28 md:pb-10" : ""}`}>
          <div className="mx-auto max-w-[1040px]">{children}</div>
        </main>
      </div>

      {social ? <BottomNav unread={unread} /> : null}
    </div>
  );
}

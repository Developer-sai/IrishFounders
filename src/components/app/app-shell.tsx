import Link from "next/link";
import {
  Bell, Bookmark, Briefcase, Handshake, LayoutDashboard, MessageSquare, Newspaper,
  Rocket, Search, Settings, Shield, Users, FlaskConical, Building2, ScrollText, Flag, UserCog, ClipboardCheck,
  CalendarClock, Landmark, Home, Sparkles,
} from "lucide-react";
import { Logo } from "@/components/marketing/site-header";
import { Avatar } from "@/components/ui/card";
import { BottomNav, type MoreLink } from "@/components/ui/bottom-nav";
import { CommandPalette } from "@/components/ui/command-palette";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Shortcuts } from "@/components/app/shortcuts";
import { signOut } from "@/lib/actions/auth";
import type { SessionProfile } from "@/lib/auth";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

/** The five things members do every day. Everything else lives under "More". */
export const MEMBER_PRIMARY: NavItem[] = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Sparkles },
  { href: "/launches", label: "Launch Day", icon: Rocket },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export const MEMBER_MORE: NavItem[] = [
  { href: "/dashboard/startup", label: "My Startup", icon: Building2 },
  { href: "/design-partners", label: "Find design partners", icon: FlaskConical },
  { href: "/collaborate", label: "Find collaborators", icon: Users },
  { href: "/investors", label: "Investors", icon: Landmark },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const INVESTOR_PRIMARY: NavItem[] = [
  { href: "/investor/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/investor/discover", label: "Discover startups", icon: Search },
  { href: "/launches", label: "Launch Day", icon: Rocket },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export const INVESTOR_MORE: NavItem[] = [
  { href: "/investor/introductions", label: "Introductions", icon: Handshake },
  { href: "/investor/saved", label: "Saved startups", icon: Bookmark },
  { href: "/feed", label: "Community", icon: Newspaper },
  { href: "/investor/profile", label: "My profile", icon: UserCog },
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

const linkCls =
  "group flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] text-[hsl(150_20%_96%/0.68)] transition-colors hover:bg-[hsl(150_20%_96%/0.08)] hover:text-[hsl(150_20%_96%)] focus-visible:ring-offset-sidebar";

function NavLink({ item, unread }: { item: NavItem; unread: number }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={linkCls}>
      <Icon className="h-4 w-4 opacity-70 group-hover:opacity-100" aria-hidden />
      <span>{item.label}</span>
      {item.href === "/notifications" && unread > 0 ? (
        <span className="ml-auto rounded-sm bg-accent px-1.5 font-mono text-[10px] font-semibold text-accent-foreground" aria-label={`${unread} unread`}>{unread}</span>
      ) : null}
    </Link>
  );
}

export function AppShell({
  nav, more = [], session, unread = 0, area, children, social = false, isFounder = false,
}: {
  nav: NavItem[];
  /** secondary destinations, collapsed under "More" */
  more?: NavItem[];
  session: SessionProfile;
  unread?: number;
  area: string;
  children: React.ReactNode;
  /** member workspace: shows the mobile tab bar and keyboard shortcuts */
  social?: boolean;
  isFounder?: boolean;
}) {
  const paletteLinks = [...nav, ...more].map((n) => ({ href: n.href, label: n.label }));
  const mobileMore: MoreLink[] = [
    { href: `/founders/${session.id}`, label: "My profile" },
    { href: "/messages", label: "Messages" },
    { href: "/notifications", label: unread ? `Notifications (${unread})` : "Notifications" },
    ...more.map((m) => ({ href: m.href, label: m.label })),
  ];
  const investor = area === "Investor";

  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_1fr]">
      {/* ---------------- desktop sidebar */}
      <aside className="hidden bg-sidebar text-[hsl(150_20%_96%)] md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-y-auto">
        <div className="flex h-16 items-center justify-between px-5">
          <Logo onDark />
        </div>
        <p className="px-5 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(150_20%_96%/0.45)]">{area}</p>
        <nav aria-label={`${area} navigation`} className="flex-1 px-3 pb-3">
          <div className="space-y-px">
            {nav.map((item) => <NavLink key={item.href} item={item} unread={unread} />)}
          </div>
          {more.length > 0 ? (
            <details className="group/more mt-4 border-t border-[hsl(150_20%_96%/0.12)] pt-3" open>
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[hsl(150_20%_96%/0.45)] hover:text-[hsl(150_20%_96%/0.8)] [&::-webkit-details-marker]:hidden">
                More
                <span aria-hidden className="transition-transform group-open/more:rotate-90">›</span>
              </summary>
              <div className="mt-1 space-y-px">
                {more.map((item) => <NavLink key={item.href} item={item} unread={unread} />)}
              </div>
            </details>
          ) : null}
        </nav>
        <div className="border-t border-[hsl(150_20%_96%/0.12)] p-4">
          <Link href={`/founders/${session.id}`} className="flex items-center gap-3 rounded-sm hover:opacity-90">
            <Avatar name={session.full_name} src={session.avatar_url} size={32} />
            <div className="min-w-0">
              <p className="truncate text-sm">{session.full_name}</p>
              <p className="truncate font-mono text-[10px] text-[hsl(150_20%_96%/0.5)]">{session.email}</p>
            </div>
          </Link>
          <form action={signOut} className="mt-3">
            <button type="submit" className="w-full rounded-sm border border-[hsl(150_20%_96%/0.25)] py-1.5 text-[13px] text-[hsl(150_20%_96%/0.85)] transition-colors hover:border-[hsl(150_20%_96%/0.6)] hover:text-[hsl(150_20%_96%)]">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="relative min-w-0">
        {/* soft ambient light behind the content (static gradient: costs nothing while scrolling) */}
        <div aria-hidden className="glow pointer-events-none absolute inset-x-0 top-0 -z-0 h-80 opacity-60" />
        {/* ---------------- top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 md:justify-end md:px-10">
          <div className="md:hidden"><Logo compactOnPhone /></div>
          <div className="flex items-center gap-2">
            <CommandPalette links={paletteLinks} />
            <ThemeToggle />
            <Link href="/messages" aria-label="Messages" className="inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-muted/70 md:hidden">
              <MessageSquare className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-muted/70 md:hidden">
              <Bell className="h-4 w-4" aria-hidden />
              {unread > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" /> : null}
            </Link>
          </div>
        </div>
        <main id="main" className={`relative px-4 py-8 md:px-10 md:py-10 ${social ? "pb-28 md:pb-10" : ""}`}>
          <div className="mx-auto max-w-[1040px]">{children}</div>
        </main>
      </div>

      {social ? (
        <>
          <BottomNav
            homeHref={investor ? "/investor/dashboard" : "/feed"}
            discoverHref={investor ? "/investor/discover" : "/discover"}
            more={mobileMore}
            isFounder={isFounder}
          />
          <Shortcuts />
        </>
      ) : null}
    </div>
  );
}

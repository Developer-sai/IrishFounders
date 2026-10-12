import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { RouteProgress } from "@/components/ui/route-progress";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"),
  title: { default: "Space of Founders: the verified space for the world's founders", template: "%s · Space of Founders" },
  description:
    "A verified network for founders building companies anywhere in the world, and the investors and partners who back them. Real founders. Real companies.",
  openGraph: { siteName: "Space of Founders", type: "website", locale: "en" },
  appleWebApp: { capable: true, title: "Space of Founders", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { color: "#021510" },
  ],
};

/** Applies a saved theme before first paint to avoid a flash. */
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IE" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
          Skip to content
        </a>
        <RouteProgress />
        {children}
        <Toaster />
        {process.env.VERCEL ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}

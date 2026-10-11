import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Irish Founders — Where Ireland's Founders Build Together", template: "%s · Irish Founders" },
  description:
    "A verified community connecting founders, startups, investors and builders across Ireland. Real founders. Real companies.",
  openGraph: { siteName: "Irish Founders", type: "website", locale: "en_IE" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IE">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Irish Founders",
    short_name: "Irish Founders",
    description: "A verified community for Ireland's founders, startups and investors.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#F5F1E8",
    theme_color: "#F5F1E8",
    lang: "en-IE",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Irish Founders",
    short_name: "Irish Founders",
    description: "A verified network for companies built in Ireland and the investors around the world who back them.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#021510",
    theme_color: "#021510",
    lang: "en-IE",
    icons: [
      { src: "/brand/mark-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/mark-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/mark-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

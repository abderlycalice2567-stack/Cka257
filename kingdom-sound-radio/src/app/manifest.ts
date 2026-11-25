import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Kingdom Sound Radio",
    short_name: "Kingdom Sound",
    description: "Broadcasting Faith. Connecting Communities. Transforming Lives.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1120",
    theme_color: "#0B1120",
    categories: ["music", "news", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Listen live", url: "/en/live" },
      { name: "Schedule", url: "/en/schedule" },
    ],
  };
}

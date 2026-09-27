import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tuckbury",
    short_name: "Tuckbury",
    description: "Cozy notes, reminders and a daily journal with a squirrel sidekick.",
    start_url: "/home",
    display: "standalone",
    background_color: "#FFF8E7",
    theme_color: "#FF8A3D",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

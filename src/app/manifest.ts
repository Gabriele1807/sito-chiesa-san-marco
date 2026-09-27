import type { MetadataRoute } from "next";

/**
 * Web App Manifest: rende il sito installabile come app (Android, desktop,
 * iOS dal menu Condividi). Servito da Next.js su /manifest.webmanifest.
 * Colori allineati a --color-background (sfondo) e alla barra superiore.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Chiesa Copta Ortodossa di San Marco – Milano",
    short_name: "San Marco",
    description:
      "Orari delle liturgie, avvisi, eventi e preghiere della Chiesa Copta Ortodossa di San Marco a Milano.",
    lang: "it",
    dir: "auto",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#FFF9F2",
    theme_color: "#FFF9F2",
    categories: ["lifestyle", "education", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Orari delle liturgie",
        short_name: "Orari",
        url: "/?source=pwa-shortcut#orari",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Avvisi",
        short_name: "Avvisi",
        url: "/avvisi?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Eventi",
        short_name: "Eventi",
        url: "/eventi?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Preghiere",
        short_name: "Preghiere",
        url: "/preghiere?source=pwa-shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/metadata";

// Only public, indexable pages — the site serves one URL per page and
// switches locale via a cookie (src/i18n/request.ts), not a URL prefix,
// so there is exactly one entry per route regardless of language.
// Sections gated by SectionVisibilityGate (eventi, icone, libreria, orari,
// preghiere, video-corsi) are still listed: when a section is hidden it
// shows a "coming soon"/access page rather than 404ing, so it's still a
// valid URL worth indexing once content is published.
const PUBLIC_PATHS = [
  "",
  "/chi-siamo",
  "/contatti",
  "/eventi",
  "/icone",
  "/libreria",
  "/preghiere",
  "/video-corsi",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}

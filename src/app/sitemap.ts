import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/metadata";
import { getIcone, getTestiSacri } from "@/lib/db";

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
  "/avvisi",
  "/richieste-preghiera",
];

// Legal pages change rarely: use the date of their last revision
// (UPDATED_AT in each page) instead of "now", so crawlers don't see
// them as modified on every request.
const LEGAL_PATHS: { path: string; lastModified: string }[] = [
  { path: "/privacy", lastModified: "2026-09-28" },
  { path: "/termini", lastModified: "2026-09-26" },
  { path: "/cookie-policy", lastModified: "2026-10-26" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    ...PUBLIC_PATHS.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: (path === "" ? "daily" : "weekly") as "daily" | "weekly",
      priority: path === "" ? 1 : 0.7,
    })),
    ...LEGAL_PATHS.map(({ path, lastModified }) => ({
      url: `${base}${path}`,
      lastModified: new Date(lastModified),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  // Detail pages come from the DB. If it is unreachable at request time we
  // still serve the static entries instead of failing the whole sitemap.
  try {
    const [icone, testi] = await Promise.all([getIcone(), getTestiSacri()]);
    for (const { slug } of icone) {
      if (!slug) continue;
      entries.push({
        url: `${base}/icone/${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const { slug } of testi) {
      if (!slug) continue;
      entries.push({
        url: `${base}/libreria/${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // keep static entries only
  }

  return entries;
}

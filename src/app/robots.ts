import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/profilo",
        "/iscrizioni",
        "/forgot-password",
        "/reset-password",
        "/verifica-email",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

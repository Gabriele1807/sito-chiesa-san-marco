import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

const SITE_NAME = "Chiesa Copta Ortodossa di San Marco – Milano";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.sanmarcocopti.it";
}

/**
 * Builds per-page Metadata (title/description + matching Open Graph) reusing
 * the page's own next-intl translations, so page titles stay in sync with
 * on-page copy instead of duplicating strings. `path` is the route's
 * canonical path (e.g. "/chi-siamo") used for `alternates.canonical` and the
 * Open Graph URL.
 *
 * The site serves a single URL per page and switches locale via a cookie
 * (see src/i18n/request.ts), not a URL prefix — so there is one canonical
 * URL per page regardless of language, and metadata reflects whichever
 * locale the current request resolved to.
 */
export async function buildPageMetadata(
  namespace: string,
  titleKey: string,
  descriptionKey: string,
  path: string
): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations(namespace)]);

  const title = t(titleKey);
  const description = t(descriptionKey);
  const url = `${siteUrl()}${path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} – ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: locale === "ar" ? "ar_EG" : "it_IT",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export { SITE_NAME, siteUrl };

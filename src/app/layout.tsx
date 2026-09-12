import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Naskh_Arabic, Source_Sans_3 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/components/auth/AuthContext";
import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";
import "./globals.css";

export const dynamic = "force-dynamic";

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const arabicFont = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
});

const SITE_NAME = "Chiesa Copta Ortodossa di San Marco – Milano";
const SITE_DESCRIPTION =
  "Sito ufficiale della Chiesa Copta Ortodossa di San Marco di Milano. Scopri le nostre icone sacre, testi liturgici, preghiere e gli eventi della comunità.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.sanmarcocopti.it";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s – ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD (schema.org) per la scheda locale/religiosa: aiuta i motori di
// ricerca a mostrare indirizzo e orari nella ricerca senza dover fare
// scraping del testo della pagina.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "PlaceOfWorship",
  name: SITE_NAME,
  url: SITE_URL,
  image: `${SITE_URL}/logo-san-marco.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Via Senato, 4",
    addressLocality: "Milano",
    postalCode: "20121",
    addressCountry: "IT",
  },
  sameAs: [
    "https://www.facebook.com/people/Chiesa-di-San-Marco/61556571205312/",
    "https://www.youtube.com/@SanMarco-Milano",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir="ltr" data-locale={locale} suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${arabicFont.variable} force-motion antialiased`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <LoginModal />
            <RegisterModal />
          </AuthProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

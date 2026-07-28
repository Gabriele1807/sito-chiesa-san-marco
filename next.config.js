const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;

// Aggiungi qui nuovi script esterni consentiti dalla CSP.
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  "https://www.youtube.com",
  "https://www.googletagmanager.com",
  "https://va.vercel-scripts.com",
  "https://vitals.vercel-insights.com",
];

// Aggiungi qui nuovi CDN o origini per immagini.
const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  "https://i.ytimg.com",
  "https://img.youtube.com",
  "https://lh3.googleusercontent.com",
  "https://drive.google.com",
];

// Aggiungi qui nuovi endpoint API o backend esterni.
const connectSrc = [
  "'self'",
  "https://sito-chiesa-san-marco.vercel.app",
  "https://www.googleapis.com",
  "https://vitals.vercel-insights.com",
  "https://*.vercel-insights.com",
  "https://va.vercel-scripts.com",
  "https://*.vercel-scripts.com",
];

// Aggiungi qui nuovi provider di embed iframe.
const frameSrc = [
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://drive.google.com",
  "https://docs.google.com",
  "https://maps.google.com",
  "https://www.google.com",
];

if (supabaseOrigin) {
  connectSrc.push(supabaseOrigin);
}

const contentSecurityPolicy = `
  default-src 'self';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  object-src 'none';
  script-src ${scriptSrc.join(" ")};
  style-src 'self' 'unsafe-inline';
  img-src ${imgSrc.join(" ")};
  font-src 'self' data:;
  connect-src ${connectSrc.join(" ")};
  frame-src ${frameSrc.join(" ")};
  media-src 'self' blob:;
  manifest-src 'self';
  worker-src 'self' blob:;
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          }, // CSP: limita sorgenti consentite per script, immagini, iframe, API e asset.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          }, // Referrer Policy: riduce i dati inviati verso domini esterni.
          {
            key: "X-Frame-Options",
            value: "DENY",
          }, // Clickjacking protection: impedisce l'embedding del sito in iframe altrui.
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          }, // MIME sniffing protection: forza il browser a rispettare i content type dichiarati.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          }, // HSTS: forza l'uso di HTTPS su dominio e sottodomini.
          {
            key: "X-XSS-Protection",
            value: "0",
          }, // Legacy header: disabilita i vecchi filtri XSS del browser.
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

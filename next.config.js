const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;

const connectSrc = [
  "'self'",
  "https://vitals.vercel-insights.com",
  "https://*.vercel-insights.com",
  "https://va.vercel-scripts.com",
  "https://*.vercel-scripts.com",
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
  script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vitals.vercel-insights.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://lh3.googleusercontent.com https://drive.google.com https://i.ytimg.com https://img.youtube.com;
  font-src 'self' data:;
  connect-src ${connectSrc.join(" ")};
  frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://docs.google.com https://maps.google.com https://www.google.com;
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
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

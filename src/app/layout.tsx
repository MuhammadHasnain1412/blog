import "@/lib/env"; // ✅ Validates required env vars at startup — crashes fast if missing
import type { Metadata } from "next";
import { ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import { Providers } from "@/components/providers";
import { auth } from "@/auth";
import { headers } from "next/headers";
import "./globals.css";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://thedailymixa.com";
const GA_ID = "G-6BMBVYCBMH";

export const metadata: Metadata = {
  title: {
    default: "The Daily Mixa",
    template: "%s | The Daily Mixa",
  },
  description:
    "The Daily Mixa — Breaking news, in-depth analysis, and the stories that matter. Your trusted source for daily news.",
  metadataBase: new URL(BASE_URL),
  // ✅ Canonical homepage URL — tells Google the definitive URL of the home page
  alternates: {
    canonical: BASE_URL,
  },
  // ✅ Site-wide OpenGraph defaults
  openGraph: {
    siteName: "The Daily Mixa",
    type: "website",
    locale: "en_US",
    url: BASE_URL,
  },
  // ✅ Twitter / X card defaults — applies to every page that doesn't override
  twitter: {
    card: "summary_large_image",
    site: "@thedailymixa",
  },
  // ✅ Default indexing rules — individual pages can override
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // ✅ Google Search Console ownership verification
  verification: {
    google: "U9C8QI5wacpJ4L2O7JP4GHA8ekWBEcl5SZPbI96TkBw",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // ✅ Read nonce set by proxy.ts — falls back gracefully if header not present
  const nonce = (await headers()).get("x-nonce") ?? "";

  // ✅ WebSite schema with SearchAction — enables Google Sitelinks Search Box
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The Daily Mixa",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/archive?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ Pass nonce so Mantine's inline script is allowed by CSP */}
        <ColorSchemeScript nonce={nonce} suppressHydrationWarning />
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />

        {/* ✅ WebSite Schema with SearchAction */}
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>

      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}

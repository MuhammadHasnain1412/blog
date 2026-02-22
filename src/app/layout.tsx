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

export const metadata: Metadata = {
  title: {
    default: "The Daily Mixa",
    template: "%s | The Daily Mixa",
  },
  description: "Modern Magazine & News Platform",
  // ✅ Required for Next.js to resolve relative og:image URLs correctly
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://thedailymixa.com"),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // ✅ Read nonce set by proxy.ts — falls back gracefully if header not present
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ Pass nonce so Mantine's inline script is allowed by CSP */}
        <ColorSchemeScript nonce={nonce} suppressHydrationWarning />
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

        {/* ✅ WebSite Schema — helps Google understand the site structure */}
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "The Daily Mixa",
              url: process.env.NEXTAUTH_URL ?? "https://thedailymixa.com",
            }),
          }}
        />
      </head>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}

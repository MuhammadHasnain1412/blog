/**
 * Next.js 16 renamed middleware.ts → proxy.ts
 *
 * This file handles two things:
 * 1. Auth protection — redirects unauthenticated users away from /dashboard
 * 2. CSP headers — generates a per-request nonce for script-src
 */

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req: NextRequest) {
  // ── Content Security Policy ───────────────────────────────────────────────
  // Generate a cryptographically random nonce for each request.
  // This allows specific inline scripts (Mantine ColorSchemeScript) to run
  // while blocking injected scripts from XSS attacks.
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(16)),
  ).toString("base64");

  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    `default-src 'self'`,
    // ✅ Added googletagmanager.com for GA4 script loading
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    // ✅ Added google-analytics.com for GA4 image pings
    `img-src 'self' data: blob: https://images.unsplash.com https://thedailymixa-images.s3.eu-north-1.amazonaws.com https://www.google-analytics.com`,
    // ✅ Added GA4 domains for analytics data collection
    `connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com`,
    `frame-ancestors 'none'`,
  ].join("; ");
  // Set headers on request
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  // Return response with modified headers
  let res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);

  // ── Additional security headers ───────────────────────────────────────────
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // ✅ HSTS — tells browsers to always use HTTPS for this domain
  // Only set in production to avoid breaking local HTTP dev server
  if (!isDev) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return res;
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.svg, robots.txt, sitemap.xml
     * - /api/auth routes (NextAuth handles these internally)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|api/auth).*)",
  ],
};

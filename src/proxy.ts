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
    // ✅ nonce allows Mantine's ColorSchemeScript inline script
    // ✅ unsafe-eval only in dev — required by TipTap/ProseMirror
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,
    // ✅ unsafe-inline required — Mantine uses CSS-in-JS
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https://images.unsplash.com`,
    `connect-src 'self'`,
    // ✅ Blocks this page from being embedded in iframes (clickjacking)
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

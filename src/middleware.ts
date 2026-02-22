// src/middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// @ts-expect-error: next-auth v4 typing incompatibility with v5 syntax
const { auth } = NextAuth(authConfig);

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64");
}

function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";

  const directives = [
    // ✅ Default: block everything not explicitly allowed
    `default-src 'self'`,

    // ✅ Scripts: nonce for inline Next.js scripts, self for app bundle
    // 'unsafe-eval' needed for TipTap in development only
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,

    // ✅ Styles: Mantine uses inline styles heavily — unsafe-inline required
    // This is a known limitation of CSS-in-JS libraries
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

    // ✅ Fonts: Google Fonts + self
    `font-src 'self' https://fonts.gstatic.com`,

    // ✅ Images: self + data URIs (TipTap uses data: for pasted images)
    // + Unsplash for your placeholder images
    `img-src 'self' data: blob: https://images.unsplash.com`,

    // ✅ Connect: API calls — your own domain only
    `connect-src 'self'`,

    // ✅ Block framing — prevents clickjacking
    `frame-ancestors 'none'`,

    // ✅ Block object/embed tags
    `object-src 'none'`,

    // ✅ Block base tag hijacking
    `base-uri 'self'`,

    // ✅ Form submissions only to self
    `form-action 'self'`,

    // ✅ Upgrade HTTP to HTTPS
    `upgrade-insecure-requests`,
  ];

  return directives.join("; ");
}

export default auth(async function middleware(req: NextRequest) {
  const nonce = generateNonce();
  const csp = buildCSP(nonce);

  const requestHeaders = new Headers(req.headers);
  // Pass nonce to the app via header (readable in Server Components)
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // ✅ Set CSP on the response
  response.headers.set("content-security-policy", csp);

  // ✅ Additional security headers
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set(
    "strict-transport-security",
    "max-age=31536000; includeSubDomains",
  );

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

// src/auth.config.ts

import type { NextAuthConfig } from "next-auth";

const isProduction = process.env.NODE_ENV === "production";

export const authConfig = {
  trustHost: true,

  pages: {
    signIn: "/login",
    error: "/login", // ✅ Don't expose /api/auth/error — send errors to login page
  },

  // ✅ MUST DO: Secure cookie configuration
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true, // JS cannot read this cookie
        sameSite: "strict" as const, // Protects against CSRF on navigation
        path: "/",
        secure: isProduction, // HTTPS only in production
      },
    },
    callbackUrl: {
      name: isProduction
        ? "__Secure-authjs.callback-url"
        : "authjs.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProduction,
      },
    },
    csrfToken: {
      name: isProduction
        ? "__Host-authjs.csrf-token" // __Host- prefix = stricter than __Secure-
        : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProduction,
      },
    },
  },

  callbacks: {
    authorized({
      auth,
      request: { nextUrl },
    }: {
      auth: any;
      request: { nextUrl: any };
    }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return Response.redirect(new URL("/login", nextUrl));
      } else if (isLoggedIn && isOnLogin) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },

  providers: [],
} satisfies NextAuthConfig;

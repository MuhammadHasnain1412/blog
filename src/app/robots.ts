import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://thedailymixa.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        // ✅ Block admin, auth, and API routes from being indexed
        disallow: ["/dashboard/", "/login", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}

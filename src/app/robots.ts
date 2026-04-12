import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://thedailymixa.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // ✅ Block admin and API routes from being crawled
        disallow: ["/dashboard/", "/api/"],
      },
    ],
    // ✅ Point Googlebot to the production sitemap URL directly
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}

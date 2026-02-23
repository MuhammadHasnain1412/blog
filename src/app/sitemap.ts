import type { MetadataRoute } from "next";
import { db } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://thedailymixa.com";

export const revalidate = 3600; // Regenerate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ─────────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/archive`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // ── Category pages ────────────────────────────────────────────────────────────
  const categories = await db.category.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { name: "asc" },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // ── Published post pages ──────────────────────────────────────────────────────
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/posts/${post.slug}`,
    lastModified: post.updatedAt ?? post.publishedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...postPages];
}

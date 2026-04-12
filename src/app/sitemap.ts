import type { MetadataRoute } from "next";
import { db } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/urls";

export const revalidate = 3600; // Regenerate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ─────────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: absoluteUrl("/archive"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/contact"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // ── Category pages ────────────────────────────────────────────────────────────
  const categories = await db.category.findMany({
    where: { post: { some: { status: "PUBLISHED" } } },
    select: { slug: true, updatedAt: true },
    orderBy: { name: "asc" },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/${category.slug}`),
    lastModified: category.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // ── Published post pages ──────────────────────────────────────────────────────
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const latestContentUpdate =
    posts[0]?.updatedAt ?? posts[0]?.publishedAt ?? new Date();

  staticPages[0].lastModified = latestContentUpdate;
  staticPages[1].lastModified = latestContentUpdate;

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/posts/${post.slug}`),
    lastModified: post.updatedAt ?? post.publishedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...postPages];
}

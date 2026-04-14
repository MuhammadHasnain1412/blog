import type { MetadataRoute } from "next";
import { db } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/archive"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const categories = await db.category.findMany({
      where: { post: { some: { status: "PUBLISHED" } } },
      select: { slug: true, updatedAt: true },
    });

    const posts = await db.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 5000,
    });

    const categoryPages = categories.map((category) => ({
      url: absoluteUrl(`/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    const postPages = posts.map((post) => ({
      url: absoluteUrl(`/posts/${post.slug}`),
      lastModified: post.updatedAt ?? post.publishedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    return [...staticPages, ...categoryPages, ...postPages];
  } catch (error) {
    // DB not available — return static pages only
    console.warn("Sitemap: DB unavailable, returning static pages only", error);
    return staticPages;
  }
}

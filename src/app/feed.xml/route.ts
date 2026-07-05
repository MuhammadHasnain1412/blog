import { db } from "@/lib/prisma";
import { absolutePostUrl, absoluteUrl } from "@/lib/urls";

const SITE_TITLE = "The Daily Mixa";
const SITE_DESCRIPTION =
  "Breaking news, in-depth analysis, and the stories that matter.";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      createdAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const lastBuildDate =
    posts.length > 0
      ? new Date(posts[0].publishedAt ?? posts[0].createdAt).toUTCString()
      : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const pubDate = new Date(
        post.publishedAt ?? post.createdAt,
      ).toUTCString();
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${absolutePostUrl(post.slug)}</link>
      <guid isPermaLink="true">${absolutePostUrl(post.slug)}</guid>
      <description>${escapeXml(post.excerpt ?? "")}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(post.category.name)}</category>
      ${post.author?.name ? `<author>${escapeXml(post.author.name)}</author>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${absoluteUrl("/")}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}

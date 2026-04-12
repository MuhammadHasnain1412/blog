import { db } from "@/lib/prisma";
import {
  Title,
  Text,
  Container,
  Badge,
  Group,
  TypographyStylesProvider,
  Image,
  Stack,
  Divider,
} from "@mantine/core";
import { notFound } from "next/navigation";
import { absolutePostUrl, absoluteUrl } from "@/lib/urls";
import DOMPurify from "isomorphic-dompurify";
import { JSDOM } from "jsdom";

// ✅ ISR: Revalidate this page every hour (3600 seconds)
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postSlug: string }>;
}) {
  const { postSlug } = await params;
  const post = await db.post.findUnique({
    where: { slug: postSlug },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      createdAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  if (!post) return { title: "Not Found" };

  const canonicalUrl = absolutePostUrl(postSlug);
  const ogImage = post.coverImage || absoluteUrl("/og-default.jpg");

  return {
    title: post.title,
    description: post.excerpt ?? `Read ${post.title} on The Daily Mixa`,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? "",
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      url: canonicalUrl,
      type: "article",
      siteName: "The Daily Mixa",
      publishedTime: (post.publishedAt || post.createdAt).toISOString(),
      authors: post.author?.name ? [post.author.name] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? "",
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ postSlug: string }>;
}) {
  const { postSlug } = await params;

  const post = await db.post.findUnique({
    where: { slug: postSlug },
    select: {
      title: true,
      content: true,
      excerpt: true,
      coverImage: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  if (!post || post.status !== "PUBLISHED") {
    return notFound();
  }

  const canonicalUrl = absolutePostUrl(postSlug);

  // ── Article JSON-LD schema ───────────────────────────────────────────────────
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article", // Use generic Article or NewsArticle
    headline: post.title,
    description: post.excerpt ?? "",
    url: canonicalUrl,
    datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author?.name ?? "The Daily Mixa Staff",
    },
    publisher: {
      "@type": "Organization",
      name: "The Daily Mixa",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    ...(post.coverImage && {
      image: {
        "@type": "ImageObject",
        url: post.coverImage,
      },
    }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  const cleanHTML = DOMPurify.sanitize(post.content, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "script", "iframe", "form", "object"],
    FORBID_ATTR: ["onerror", "onload", "onmouseover"],
  });
  const normalizedHTML = normalizeArticleLinks(cleanHTML);

  return (
    <article>
      {/* ✅ Article JSON-LD — Essential for SEO author cards and rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Container size="md" py={60}>
        <Stack gap="xl">
          <Stack gap="md" align="center">
            <Badge color="dark" size="lg" radius="xs" variant="outline">
              {post.category?.name || "Uncategorized"}
            </Badge>
            <Title
              order={1}
              ta="center"
              style={{
                fontSize: "3.5rem",
                lineHeight: 1.1,
                letterSpacing: "-1px",
              }}
            >
              {post.title}
            </Title>
            <Text size="lg" c="dimmed" ta="center" maw={700} mx="auto">
              {post.excerpt}
            </Text>
            <Divider w={100} color="dark" size="lg" my="md" />
            <Group gap="xl">
              <Stack gap={2}>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Author
                </Text>
                <Text fw={700}>{post.author?.name || "Unknown Writer"}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Published
                </Text>
                <Text fw={700}>
                  {new Date(
                    post.publishedAt || post.createdAt,
                  ).toLocaleDateString()}
                </Text>
              </Stack>
            </Group>
          </Stack>

          {post.coverImage && (
            <Image
              src={post.coverImage}
              radius="sm"
              alt={post.title}
              style={{ width: "100%" }}
            />
          )}

          <Container size="sm" p={0}>
            <TypographyStylesProvider>
              <div
                style={{ fontSize: "1.2rem", lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: normalizedHTML }}
              />
            </TypographyStylesProvider>
          </Container>

          <Divider my="xl" />
        </Stack>
      </Container>
    </article>
  );
}

function normalizeArticleLinks(html: string): string {
  const dom = new JSDOM(`<body>${html}</body>`);
  const siteOrigin = new URL(absoluteUrl("/")).origin;
  const anchors = dom.window.document.querySelectorAll("a[href]");

  Array.from(anchors).forEach((node) => {
    const anchor = node as Element;
    const href = anchor.getAttribute("href");

    if (!href) return;

    try {
      const url = new URL(href, absoluteUrl("/"));
      if (url.origin !== siteOrigin) return;

      const relValues = new Set(
        (anchor.getAttribute("rel") ?? "")
          .split(/\s+/)
          .filter(Boolean)
          .map((value) => value.toLowerCase()),
      );

      relValues.delete("nofollow");

      if (relValues.size === 0) {
        anchor.removeAttribute("rel");
        return;
      }

      anchor.setAttribute("rel", Array.from(relValues).join(" "));
    } catch {
      // Ignore malformed hrefs
    }
  });

  return dom.window.document.body.innerHTML;
}

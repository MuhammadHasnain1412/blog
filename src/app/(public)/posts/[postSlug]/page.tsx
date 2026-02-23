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
      category: { select: { name: true } },
    },
  });
  if (!post) return { title: "Not Found" };

  const canonicalUrl = absolutePostUrl(postSlug);

  return {
    title: `${post.title} — The Daily Mixa`,
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
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
        : [],
      url: canonicalUrl,
      type: "article",
      siteName: "The Daily Mixa",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? "",
      images: post.coverImage ? [post.coverImage] : [],
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
  // Google uses this for rich results: author cards, date, headline, image
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
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
    USE_PROFILES: { html: true }, // strips malicious SVG/Mathml traits
    FORBID_TAGS: ["style", "script", "iframe", "form", "object"],
    FORBID_ATTR: ["onerror", "onload", "onmouseover"], // block inline JS execution
  });

  return (
    <article>
      {/* ✅ Article JSON-LD — Google rich results: author, date, headline */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Container size="md" py={60}>
        <Stack gap="xl">
          {/* Header Section */}
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

          {/* Featured Image */}
          {post.coverImage && (
            <Image
              src={post.coverImage}
              radius="sm"
              alt={post.title}
              style={{ width: "100%" }}
            />
          )}

          {/* Content */}
          <Container size="sm" p={0}>
            <TypographyStylesProvider>
              <div
                style={{ fontSize: "1.2rem", lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: cleanHTML }}
              />
            </TypographyStylesProvider>
          </Container>

          <Divider my="xl" />

          {/* Related / Footer Tags can go here */}
        </Stack>
      </Container>
    </article>
  );
}

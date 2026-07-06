import { db } from "@/lib/prisma";
import {
  Title,
  Text,
  Container,
  Badge,
  Group,
  TypographyStylesProvider,
  Stack,
  Divider,
  Anchor,
  Breadcrumbs,
  Card,
  Box,
  SimpleGrid,
} from "@mantine/core";
import NextImage from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { absolutePostUrl, absoluteUrl, postUrl } from "@/lib/urls";
import sanitizeHtml from "sanitize-html";
import ShareButtons from "@/components/posts/ShareButtons";

export const revalidate = 120;

export async function generateStaticParams() {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return posts.map((post) => ({ postSlug: post.slug }));
}

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
  const ogImage = post.coverImage || absoluteUrl("/icon.svg");

  return {
    title: post.title,
    description: post.excerpt ?? `Read ${post.title} on The Daily Mixa`,
    keywords: [post.category?.name, post.title, "The Daily Mixa"].filter(Boolean),
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
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!post || post.status !== "PUBLISHED") {
    return notFound();
  }

  const wordCount = post.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const relatedPosts = post.category
    ? await db.post.findMany({
        where: {
          status: "PUBLISHED",
          slug: { not: postSlug },
          categoryId: post.category.id,
        },
        select: {
          title: true,
          slug: true,
          coverImage: true,
          publishedAt: true,
          createdAt: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
      })
    : [];

  const canonicalUrl = absolutePostUrl(postSlug);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      ...(post.category?.name
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: post.category.name,
              item: absoluteUrl(`/${post.category.slug}`),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: post.category?.name ? 3 : 2,
        name: post.title,
      },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
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
        url: absoluteUrl("/icon.svg"),
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

  const cleanHTML = sanitizeHtml(post.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "span"]),
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ["src", "alt", "width", "height"] },
    disallowedTagsMode: "discard",
  });
  const normalizedHTML = normalizeArticleLinks(cleanHTML);

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Container size="md" py={60}>
        <Stack gap="xl">
          <Breadcrumbs
            separator=">"
            styles={{ separator: { color: "var(--mantine-color-dimmed)" } }}
          >
            <Anchor component={Link} href="/" size="sm" c="dimmed">
              Home
            </Anchor>
            <Anchor
              component={Link}
              href={`/${post.category?.slug}`}
              size="sm"
              c="dimmed"
            >
              {post.category?.name}
            </Anchor>
            <Text size="sm" c="dark" lineClamp={1} maw={200}>
              {post.title}
            </Text>
          </Breadcrumbs>

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
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Read Time
                </Text>
                <Text fw={700}>{readingTime} min read</Text>
              </Stack>
            </Group>
          </Stack>

          {post.coverImage && (
            <NextImage
              src={post.coverImage}
              width={1200}
              height={630}
              alt={post.title}
              priority
              style={{ width: "100%", height: "auto", borderRadius: "4px" }}
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

          <Group justify="space-between" align="center">
            <Text size="sm" fw={700} tt="uppercase" c="dimmed">
              Share this article
            </Text>
            <ShareButtons url={canonicalUrl} title={post.title} />
          </Group>

          {relatedPosts.length > 0 && (
            <>
              <Divider my="xl" />
              <Stack gap="xl">
                <Title order={3} tt="uppercase" style={{ letterSpacing: "2px" }}>
                  More from {post.category?.name}
                </Title>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.slug}
                      href={postUrl(related.slug)}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <Card p={0} radius={0} bg="transparent" className="news-card">
                        <Stack gap="sm">
                          <Box style={{ overflow: "hidden", position: "relative", aspectRatio: "16/9" }}>
                            <NextImage
                              src={
                                related.coverImage ||
                                "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800"
                              }
                              fill
                              sizes="(max-width: 640px) 100vw, 33vw"
                              alt={related.title}
                              className="hover-zoom"
                              style={{ objectFit: "cover" }}
                            />
                          </Box>
                          <Title order={4} lineClamp={2} style={{ fontSize: "1rem" }}>
                            {related.title}
                          </Title>
                          <Text size="xs" c="dimmed">
                            {new Date(
                              related.publishedAt || related.createdAt,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Text>
                        </Stack>
                      </Card>
                    </Link>
                  ))}
                </SimpleGrid>
              </Stack>
            </>
          )}
        </Stack>
      </Container>
    </article>
  );
}

function normalizeArticleLinks(html: string): string {
  const siteOrigin = new URL(absoluteUrl("/")).origin;

  return html.replace(/<a\s([^>]*?)>/gi, (match, attrs: string) => {
    const hrefMatch = attrs.match(/href=["']([^"']*)["']/);
    if (!hrefMatch) return match;

    try {
      const url = new URL(hrefMatch[1], absoluteUrl("/"));
      if (url.origin !== siteOrigin) return match;

      const relMatch = attrs.match(/rel=["']([^"']*)["']/);
      const relValues = new Set(
        (relMatch?.[1] ?? "").split(/\s+/).filter(Boolean).map(v => v.toLowerCase())
      );
      relValues.delete("nofollow");

      if (relValues.size === 0) {
        return `<a ${attrs.replace(/\s*rel=["'][^"']*["']/i, "")}>`;
      }
      const newRel = Array.from(relValues).join(" ");
      if (relMatch) {
        return `<a ${attrs.replace(/rel=["'][^"']*["']/i, `rel="${newRel}"`)}>`;
      }
      return match;
    } catch {
      return match;
    }
  });
}

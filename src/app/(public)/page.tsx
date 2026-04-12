import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/prisma";
import {
  Container,
  Title,
  Text,
  Card,
  Image,
  Badge,
  Group,
  Stack,
  Divider,
  Box,
  SimpleGrid,
  Flex,
  Skeleton,
} from "@mantine/core";
import Link from "next/link";
// Refreshing TS module resolution
import { absoluteUrl, postUrl } from "@/lib/urls";

// ✅ Revalidate every 60 seconds instead of force-dynamic
// The home page doesn't need a fresh DB query on every single request —
// a 60-second cache means 60x fewer DB queries under load
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    url: absoluteUrl("/"),
  },
};

// ── Page shell ────────────────────────────────────────────────────────────────
// Renders immediately — Suspense streams the DB-heavy sections in behind it

export default function BlogHome() {
  return (
    <Container size="xl" py="xl">
      <Suspense fallback={<PostsSkeleton />}>
        <PostSections />
      </Suspense>
    </Container>
  );
}

// ── Skeleton shown while PostSections loads ───────────────────────────────────

function PostsSkeleton() {
  return (
    <Stack gap={60}>
      {/* Two category section skeletons */}
      {[0, 1].map((i) => (
        <Stack key={i} gap="xl">
          <Stack align="center" gap="sm">
            <Skeleton height={28} width={200} />
            <Skeleton height={4} width={60} />
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
            {[0, 1, 2].map((j) => (
              <Stack key={j} gap="sm">
                <Skeleton height={240} radius="sm" />
                <Skeleton height={20} width="85%" />
                <Skeleton height={14} width="60%" />
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
}

// ── DB query lives here — not in the page shell ───────────────────────────────
// This allows Next.js to stream the page shell to the browser first,
// then stream in this component once the DB query resolves

async function PostSections() {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    // ✅ select only what each component actually renders — not include (SELECT *)
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      createdAt: true,
      author: { select: { name: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  const categoryMap = posts.reduce(
    (acc, post) => {
      if (!acc[post.category.id]) {
        acc[post.category.id] = {
          name: post.category.name,
          slug: post.category.slug,
          posts: [],
        };
      }
      acc[post.category.id].posts.push(post);
      return acc;
    },
    {} as Record<string, { name: string; slug: string; posts: typeof posts }>,
  );

  const heroPost = posts[0];
  const categoriesWithPosts = Object.values(categoryMap);

  if (posts.length === 0) {
    return (
      <Container size="md" py={120}>
        <Stack align="center" gap="xl">
          <SectionHeader title="Welcome to The Daily Mixa" />
          <Text c="dimmed" ta="center" size="lg" maw={500}>
            We&apos;re currently preparing our latest stories. Check back soon for
            updates on World News, Celebrity insights, and more.
          </Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Stack gap={60}>
      {/* Dynamic Category Sections */}
      {categoriesWithPosts.map((cat) => (
        <section
          key={cat.slug}
          data-category-section={cat.slug}
          style={{ scrollMarginTop: "80px" }}
        >
          <SectionHeader title={cat.name} />
          <SimpleGrid
            cols={{ base: 1, sm: 2, md: cat.posts.length > 3 ? 4 : 3 }}
            spacing="xl"
          >
            {cat.posts.slice(0, 4).map((post) => (
              <NewsCard
                key={post.id}
                post={post}
                compact={cat.posts.length > 3}
              />
            ))}
          </SimpleGrid>
        </section>
      ))}

      {/* FEATURED SECTION */}
      {heroPost && (
        <section>
          {/* ✅ Featured section header links to category, not post */}
          <SectionHeader title="FEATURED POST" />
          <Flex direction={{ base: "column", md: "row" }} gap="xl">
            <Box style={{ flex: 7 }}>
              {/* ✅ Uses postUrl() — no category in URL */}
              <Link
                href={postUrl(heroPost.slug)}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Box
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "4px",
                  }}
                >
                  <Image
                    src={
                      heroPost.coverImage ||
                      "https://images.unsplash.com/photo-1504711428567-d1213501df05?auto=format&fit=crop&q=80&w=1200"
                    }
                    height={450}
                    alt={heroPost.title}
                    className="hover-zoom"
                  />
                </Box>
              </Link>
            </Box>
            <Box style={{ flex: 5 }}>
              <Stack justify="center" h="100%" gap="md">
                <Badge color="dark" size="lg" radius="xs">
                  {heroPost.category.name}
                </Badge>
                <Link
                  href={postUrl(heroPost.slug)}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Title
                    order={1}
                    style={{ fontSize: "2.5rem", lineHeight: 1.1 }}
                  >
                    {heroPost.title}
                  </Title>
                </Link>
                <Text size="lg" c="dimmed" lineClamp={3}>
                  {heroPost.excerpt}
                </Text>
                <Group gap="xs">
                  <Text fw={700} size="sm">
                    By {heroPost.author.name}
                  </Text>
                  <span style={{ color: "var(--mantine-color-gray-4)" }}>
                    •
                  </span>
                  <Text size="sm" c="dimmed">
                    {new Date(
                      heroPost.publishedAt || heroPost.createdAt,
                    ).toLocaleDateString()}
                  </Text>
                </Group>
              </Stack>
            </Box>
          </Flex>
        </section>
      )}

      {/* LATEST LIST SECTION */}
      <section>
        <SectionHeader title="LATEST NEWS" />
        <Flex gap="xl" direction={{ base: "column", md: "row" }}>
          <Box style={{ flex: 2 }}>
            <Stack gap="xl">
              {posts.slice(0, 10).map((post) => (
                <NewsListItem key={post.id} post={post} />
              ))}
            </Stack>
          </Box>
          <Box style={{ flex: 1 }}>
            <Box style={{ position: "sticky", top: 80 }}>
              <Stack gap="xl">
                <Box
                  p="xl"
                  bg="gray.0"
                  style={{ borderLeft: "4px solid #000" }}
                >
                  <Title order={4} mb="md">
                    SUBSCRIBE
                  </Title>
                  <Text size="sm" mb="md">
                    Get the latest news directly in your inbox.
                  </Text>
                  <Text
                    size="xs"
                    fw={700}
                    tt="uppercase"
                    td="underline"
                    style={{ cursor: "pointer" }}
                  >
                    Join Now
                  </Text>
                </Box>

                <Box>
                  <Title
                    order={4}
                    mb="md"
                    td="underline"
                    style={{ textDecorationThickness: "2px" }}
                  >
                    TRENDING
                  </Title>
                  <Stack gap="sm">
                    {posts.slice(0, 5).map((p, i) => (
                      <Group
                        key={p.id}
                        wrap="nowrap"
                        align="flex-start"
                        gap="md"
                      >
                        <Text size="xl" fw={900} c="gray.3" lh={1}>
                          {i + 1}
                        </Text>
                        {/* ✅ Uses postUrl() */}
                        <Link
                          href={postUrl(p.slug)}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <Text
                            size="sm"
                            fw={700}
                            lineClamp={2}
                            className="hover-dark"
                          >
                            {p.title}
                          </Text>
                        </Link>
                      </Group>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Flex>
      </section>
    </Stack>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Stack gap={10} mb={40} align="center">
      <Title
        order={2}
        style={{
          letterSpacing: "4px",
          fontSize: "1.8rem",
          textTransform: "uppercase",
        }}
      >
        {title}
      </Title>
      <Divider w={60} color="dark" size="lg" />
    </Stack>
  );
}

type PostForCard = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  category: { name: string };
};

function NewsCard({
  post,
  compact = false,
}: {
  post: PostForCard;
  compact?: boolean;
}) {
  return (
    // ✅ Uses postUrl()
    <Link
      href={postUrl(post.slug)}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card p={0} radius={0} bg="transparent" className="news-card">
        <Stack gap="sm">
          <Box style={{ overflow: "hidden" }}>
            <Image
              src={
                post.coverImage ||
                "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800"
              }
              height={compact ? 180 : 240}
              alt={post.title}
              className="hover-zoom"
            />
          </Box>
          <Stack gap={4}>
            <Title
              order={3}
              lineClamp={2}
              style={{
                fontSize: compact ? "1.1rem" : "1.25rem",
                lineHeight: 1.2,
              }}
            >
              {post.title}
            </Title>
            {!compact && (
              <Text size="sm" c="dimmed" lineClamp={2}>
                {post.excerpt}
              </Text>
            )}
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" mt={4}>
              {post.category.name} •{" "}
              {new Date(
                post.publishedAt || post.createdAt,
              ).toLocaleDateString()}
            </Text>
          </Stack>
        </Stack>
      </Card>
    </Link>
  );
}

type PostForList = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  author: { name: string | null };
  category: { name: string };
};

function NewsListItem({ post }: { post: PostForList }) {
  return (
    // ✅ Uses postUrl()
    <Link
      href={postUrl(post.slug)}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Flex gap="xl" direction={{ base: "column", sm: "row" }}>
        <Box style={{ flex: 1 }}>
          <Box style={{ overflow: "hidden" }}>
            <Image
              src={
                post.coverImage ||
                "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800"
              }
              height={160}
              alt={post.title}
              className="hover-zoom"
            />
          </Box>
        </Box>
        <Box style={{ flex: 2 }}>
          <Stack gap="xs">
            <Badge color="dark" size="xs" radius="xs">
              {post.category.name}
            </Badge>
            <Title order={3} lineClamp={2} style={{ fontSize: "1.5rem" }}>
              {post.title}
            </Title>
            <Stack gap={4}>
              <Text size="sm" c="dimmed" lineClamp={2} hiddenFrom="xs">
                {post.excerpt}
              </Text>
              <Text size="xs" c="dimmed">
                By {post.author.name} •{" "}
                {new Date(
                  post.publishedAt || post.createdAt,
                ).toLocaleDateString()}
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Flex>
    </Link>
  );
}

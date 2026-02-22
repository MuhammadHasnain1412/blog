import { db } from "@/lib/prisma";
import {
  Title,
  SimpleGrid,
  Card,
  Text,
  Container,
  Badge,
  Image,
  Stack,
  Divider,
  Box,
  Group,
} from "@mantine/core";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { postUrl } from "@/lib/urls";

// ✅ Revalidate every 60 seconds — category pages don't change per-request
export const revalidate = 60;

// ── Metadata + canonical ──────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;

  const category = await db.category.findUnique({
    where: { slug: categorySlug },
    select: { name: true },
  });

  if (!category) return { title: "Not Found" };

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://thedailymixa.com";

  return {
    title: category.name,
    description: `Browse all ${category.name} stories on The Daily Mixa.`,
    // ✅ Canonical — prevents duplicate content if category is accessed via
    // multiple paths (e.g. with/without trailing slash)
    alternates: {
      canonical: `${baseUrl}/${categorySlug}`,
    },
    openGraph: {
      title: `${category.name} — The Daily Mixa`,
      description: `Browse all ${category.name} stories on The Daily Mixa.`,
      url: `${baseUrl}/${categorySlug}`,
      type: "website",
    },
  };
}

// ── Page component ────────────────────────────────────────────────────────────

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;

  const category = await db.category.findUnique({
    where: { slug: categorySlug },
    // ✅ select instead of include — fetches only what the page renders
    select: {
      name: true,
      post: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      },
      // ✅ Count only published posts — original counted all including drafts
      _count: { select: { post: { where: { status: "PUBLISHED" } } } },
    },
  });

  if (!category) {
    return notFound();
  }

  return (
    <Container size="xl" py={60}>
      <Stack gap="xl">
        <Stack gap="xs" align="center">
          <Badge color="dark" size="lg" radius="xs">
            {category.name}
          </Badge>
          <Title
            order={1}
            fz={56}
            tt="uppercase"
            style={{ letterSpacing: "2px" }}
          >
            {category.name}
          </Title>
          <Text c="dimmed" mb="xl">
            Discover {category._count.post} stories in this category
          </Text>
          <Divider w={100} size="xl" color="dark" />
        </Stack>

        {category.post.length === 0 ? (
          <Text ta="center" py={100} c="dimmed">
            No posts found in this category.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={40}>
            {category.post.map((post) => (
              // ✅ postUrl() — category is no longer part of the post permalink
              <Link
                key={post.id}
                href={postUrl(post.slug)}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Card p={0} radius={0} bg="transparent" className="news-card">
                  <Stack gap="md">
                    <Box style={{ overflow: "hidden" }}>
                      <Image
                        src={
                          post.coverImage ||
                          "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800"
                        }
                        height={240}
                        alt={post.title}
                        className="hover-zoom"
                      />
                    </Box>
                    <Stack gap={4}>
                      <Title
                        order={3}
                        style={{ fontSize: "1.4rem", lineHeight: 1.2 }}
                      >
                        {post.title}
                      </Title>
                      <Text size="sm" c="dimmed" lineClamp={3}>
                        {post.excerpt}
                      </Text>
                      <Group gap="xs" mt="xs">
                        <Text fw={700} size="xs">
                          By {post.author.name}
                        </Text>
                        <Text size="xs" c="dimmed">•</Text>
                        <Text size="xs" c="dimmed">
                          {new Date(
                            post.publishedAt || post.createdAt,
                          ).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Stack>
                  </Stack>
                </Card>
              </Link>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}

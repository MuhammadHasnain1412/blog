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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; postSlug: string }>;
}) {
  const { postSlug } = await params;
  const post = await db.post.findUnique({
    where: { slug: postSlug },
    select: { title: true, excerpt: true },
  });
  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ categorySlug: string; postSlug: string }>;
}) {
  const { categorySlug, postSlug } = await params;

  const post = await db.post.findUnique({
    where: { slug: postSlug },
    include: { author: true, category: true },
  });

  if (
    !post ||
    post.status !== "PUBLISHED" ||
    post.category.slug !== categorySlug
  ) {
    return notFound();
  }

  return (
    <article>
      <Container size="md" py={60}>
        <Stack gap="xl">
          {/* Header Section */}
          <Stack gap="md" align="center">
            <Badge color="dark" size="lg" radius="xs" variant="outline">
              {post.category.name}
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
                <Text fw={700}>{post.author.name}</Text>
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
                dangerouslySetInnerHTML={{ __html: post.content }}
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

import type { Metadata } from "next";
import { db } from "@/lib/prisma";
import { Container, Title, Text, SimpleGrid, Stack } from "@mantine/core";
import ArchiveCard from "@/components/common/ArchiveCard";
import { absoluteUrl } from "@/lib/urls";
import SearchInput from "./SearchInput";

export const metadata: Metadata = {
  title: "Search",
  description: "Search articles on The Daily Mixa.",
  alternates: {
    canonical: absoluteUrl("/search"),
  },
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ q?: string }>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const posts = query
    ? await db.post.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: query } },
            { excerpt: { contains: query } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          createdAt: true,
          coverImage: true,
          category: { select: { name: true, slug: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 24,
      })
    : [];

  return (
    <Container size="xl" py={80}>
      <Title
        order={1}
        mb="xl"
        style={{
          fontSize: "3rem",
          textTransform: "uppercase",
          letterSpacing: "2px",
        }}
      >
        Search
      </Title>

      <SearchInput initialQuery={query} />

      {query && (
        <Text c="dimmed" mb={40} size="lg">
          {posts.length} result{posts.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
        {posts.map((post) => (
          <ArchiveCard key={post.id} post={post} />
        ))}
      </SimpleGrid>

      {query && posts.length === 0 && (
        <Stack align="center" mt={60}>
          <Text size="lg" c="dimmed">
            No articles found. Try a different search term.
          </Text>
        </Stack>
      )}
    </Container>
  );
}

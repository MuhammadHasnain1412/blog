import type { Metadata } from "next";
import { db } from "@/lib/prisma";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Group,
} from "@mantine/core";
import ArchiveCard from "@/components/common/ArchiveCard";
import { LinkButton } from "@/components/common/LinkElements";
import { absoluteUrl } from "@/lib/urls";

export const revalidate = 120;

const POSTS_PER_PAGE = 12;

type ArchiveSearchParams = Promise<{
  page?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: ArchiveSearchParams;
}): Promise<Metadata> {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const totalCount = await db.post.count({ where: { status: "PUBLISHED" } });
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const canonicalUrl =
    currentPage === 1 ? absoluteUrl("/archive") : absoluteUrl(`/archive?page=${currentPage}`);

  const links: Array<{ rel: string; url: string }> = [];
  if (currentPage > 1) {
    links.push({
      rel: "prev",
      url: currentPage === 2 ? absoluteUrl("/archive") : absoluteUrl(`/archive?page=${currentPage - 1}`),
    });
  }
  if (currentPage < totalPages) {
    links.push({
      rel: "next",
      url: absoluteUrl(`/archive?page=${currentPage + 1}`),
    });
  }

  return {
    title: currentPage === 1 ? "Archive" : `Archive — Page ${currentPage}`,
    description:
      "Browse the complete archive of stories published on The Daily Mixa.",
    keywords: ["news archive", "past stories", "The Daily Mixa archive", "all articles"],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: "Archive — The Daily Mixa",
      description:
        "Browse the complete archive of stories published on The Daily Mixa.",
      url: canonicalUrl,
      type: "website",
      images: [{ url: absoluteUrl("/icon.svg"), width: 1200, height: 630, alt: "The Daily Mixa" }],
    },
    other: Object.fromEntries(links.map((l) => [l.rel, l.url])),
  };
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: ArchiveSearchParams;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);

  const [posts, totalCount] = await Promise.all([
    db.post.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        createdAt: true,
        coverImage: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
      skip: (currentPage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    db.post.count({ where: { status: "PUBLISHED" } }),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

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
        Archive
      </Title>
      <Text c="dimmed" mb={40} size="lg">
        Browse our complete collection of stories.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
        {posts.map((post) => (
          <ArchiveCard key={post.id} post={post} />
        ))}
      </SimpleGrid>

      {posts.length === 0 && (
        <Text ta="center" size="lg" c="dimmed" mt={40}>
          No posts found in the archive.
        </Text>
      )}

      {totalPages > 1 && (
        <Group justify="center" mt={60} gap="sm">
          {currentPage > 1 && (
            <LinkButton
              href={`/archive?page=${currentPage - 1}`}
              variant="outline"
              color="dark"
            >
              Previous
            </LinkButton>
          )}
          <Text size="sm" c="dimmed" px="md">
            Page {currentPage} of {totalPages}
          </Text>
          {currentPage < totalPages && (
            <LinkButton
              href={`/archive?page=${currentPage + 1}`}
              variant="outline"
              color="dark"
            >
              Next
            </LinkButton>
          )}
        </Group>
      )}
    </Container>
  );
}

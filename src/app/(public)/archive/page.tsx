import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { Container, Title, Text, SimpleGrid } from "@mantine/core";
import ArchiveCard from "@/components/common/ArchiveCard";
import { absoluteUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

type ArchiveSearchParams = Promise<{
  q?: string | string[];
}>;

function hasSearchQuery(value: string | string[] | undefined): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return Array.isArray(value) && value.some((entry) => entry.trim().length > 0);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: ArchiveSearchParams;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const noindex = hasSearchQuery(q);

  return {
    title: "Archive",
    description:
      "Browse the complete archive of stories published on The Daily Mixa.",
    alternates: {
      canonical: absoluteUrl("/archive"),
    },
    robots: noindex
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
          },
        }
      : undefined,
    openGraph: {
      title: "Archive — The Daily Mixa",
      description:
        "Browse the complete archive of stories published on The Daily Mixa.",
      url: absoluteUrl("/archive"),
      type: "website",
    },
  };
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: ArchiveSearchParams;
}) {
  const { q } = await searchParams;

  if (hasSearchQuery(q)) {
    permanentRedirect("/archive");
  }

  const posts = await db.post.findMany({
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
  });

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
    </Container>
  );
}

import { db } from "@/lib/prisma";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Image,
  Badge,
  Stack,
  Group,
} from "@mantine/core";
import Link from "next/link";
import ArchiveCard from "@/components/common/ArchiveCard";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    include: { author: true, category: true },
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

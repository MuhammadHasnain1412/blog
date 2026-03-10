"use client";

import { postUrl } from "@/lib/urls";
import { Card, Image, Stack, Group, Badge, Title, Text } from "@mantine/core";
import Link from "next/link";

interface ArchiveCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    coverImage: string | null;
    category: {
      name: string;
      slug: string;
    };
  };
}

export default function ArchiveCard({ post }: ArchiveCardProps) {
  return (
    <Link
      href={postUrl(post.slug)}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card padding="lg" radius="md" withBorder className="hover-card">
        <Card.Section>
          <Image
            src={
              post.coverImage ||
              "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800"
            }
            height={160}
            alt={post.title}
          />
        </Card.Section>

        <Stack mt="md" gap="xs">
          <Group justify="space-between">
            <Badge color="pink" variant="light">
              {post.category?.name}
            </Badge>
            <Text size="xs" c="dimmed">
              {new Date(
                post.publishedAt || post.createdAt,
              ).toLocaleDateString()}
            </Text>
          </Group>

          <Title order={3} lineClamp={2} size="h4">
            {post.title}
          </Title>

          <Text size="sm" c="dimmed" lineClamp={3}>
            {post.excerpt}
          </Text>
        </Stack>
      </Card>
    </Link>
  );
}

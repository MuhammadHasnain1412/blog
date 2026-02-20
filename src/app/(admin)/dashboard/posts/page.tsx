import { db } from "@/lib/prisma";
import {
  Title,
  Group,
  Button,
  Badge,
  Text,
  Card,
  Tooltip,
  Box,
} from "@mantine/core";
import {
  IconPencil,
  IconTrash,
  IconEye,
  IconPlus,
  IconHistory,
} from "@tabler/icons-react";
import Link from "next/link";
import { getCurrentUser, canDeleteAnyPost, canEditPost } from "@/lib/rbac";
import { user_role } from "@prisma/client";
import PostActions from "@/components/admin/PostActions";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const userRole = (user as any).role as user_role;
  const userSession = {
    id: (user as any).id,
    email: user.email!,
    role: userRole,
  };

  const posts = await db.post.findMany({
    include: {
      author: true,
      lastUpdater: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Posts</Title>
        <Link href="/dashboard/posts/create" style={{ textDecoration: "none" }}>
          <Button leftSection={<IconPlus size={16} />}>Create Post</Button>
        </Link>
      </Group>

      <Card withBorder radius="md" p={0}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead
            style={{ background: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}
          >
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontWeight: 600,
                }}
              >
                Title
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontWeight: 600,
                }}
              >
                Audit Log
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontWeight: 600,
                }}
              >
                Category
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "12px 16px",
                  fontWeight: 600,
                }}
              >
                Status
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "12px 16px",
                  fontWeight: 600,
                  width: 80,
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "40px" }}>
                  <Text ta="center" c="dimmed">
                    No posts found
                  </Text>
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <Text fw={500} lineClamp={1}>
                      {post.title}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {post.slug}
                    </Text>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Group gap="xs" wrap="nowrap">
                      <Box>
                        <Text
                          size="xs"
                          fw={700}
                          c="dimmed"
                          tt="uppercase"
                          lh={1.2}
                        >
                          Uploaded By
                        </Text>
                        <Text size="sm" fw={500}>
                          {post.author.name}
                        </Text>
                      </Box>
                      {post.lastUpdater &&
                        post.lastUpdatedById !== post.authorId && (
                          <Tooltip
                            label={`Last edited by ${post.lastUpdater.name}`}
                          >
                            <Badge
                              size="xs"
                              variant="light"
                              leftSection={<IconHistory size={10} />}
                              color="orange"
                            >
                              Edited
                            </Badge>
                          </Tooltip>
                        )}
                    </Group>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge variant="dot" color="blue">
                      {post.category.name}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 16px" }}>
                    <Badge
                      color={
                        post.status === "PUBLISHED"
                          ? "green"
                          : post.status === "DRAFT"
                            ? "gray"
                            : "red"
                      }
                    >
                      {post.status}
                    </Badge>
                  </td>
                  <td style={{ textAlign: "right", padding: "12px 16px" }}>
                    <PostActions
                      post={post}
                      canEdit={canEditPost(userSession, post.authorId)}
                      canDelete={canDeleteAnyPost(userRole)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </Box>
  );
}

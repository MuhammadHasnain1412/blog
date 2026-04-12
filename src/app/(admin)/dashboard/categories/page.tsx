import { db } from "@/lib/prisma";
import { Title, Group, Button, Badge, Text, Card, Box } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { getCurrentUser, isAdmin, canManageCategories } from "@/lib/rbac";

import CategoryActions from "@/components/admin/CategoryActions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const userRole = user.role;

  const categories = await db.category.findMany({
    include: { _count: { select: { post: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Categories</Title>
        {canManageCategories(userRole) && (
          <Link
            href="/dashboard/categories/create"
            style={{ textDecoration: "none" }}
          >
            <Button leftSection={<IconPlus size={16} />}>
              Create Category
            </Button>
          </Link>
        )}
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
                Name
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontWeight: 600,
                }}
              >
                Slug
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "12px 16px",
                  fontWeight: 600,
                }}
              >
                Posts
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
            {categories.map((category) => (
              <tr
                key={category.id}
                style={{ borderBottom: "1px solid #f1f3f5" }}
              >
                <td style={{ padding: "12px 16px" }}>
                  <Text fw={500}>{category.name}</Text>
                  {category.parentId && (
                    <Badge size="xs" variant="outline" mt={4}>
                      Child Category
                    </Badge>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Text size="sm" c="dimmed">
                    {category.slug}
                  </Text>
                </td>
                <td style={{ textAlign: "center", padding: "12px 16px" }}>
                  <Badge variant="light" color="gray">
                    {category._count.post}
                  </Badge>
                </td>
                <td style={{ textAlign: "right", padding: "12px 16px" }}>
                  <CategoryActions
                    category={category}
                    canEdit={canManageCategories(userRole)}
                    canDelete={isAdmin(userRole)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Box>
  );
}

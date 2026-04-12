import { db } from "@/lib/prisma";
import { Title, Badge, Text, Card, Group, Avatar, Box } from "@mantine/core";
import { getCurrentUser, isAdmin } from "@/lib/rbac";
import { redirect } from "next/navigation";

import DeleteUserButton from "@/components/admin/DeleteUserButton";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const currentUserId = user.id;
  const userRole = user.role;
  if (!isAdmin(userRole)) {
    redirect("/dashboard");
  }

  // ✅ Explicit select — passwordHash is never pulled into server memory
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      posts: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Platform Users</Title>
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
                User
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontWeight: 600,
                }}
              >
                Role
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "12px 16px",
                  fontWeight: 600,
                }}
              >
                Posts Created
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "12px 16px",
                  fontWeight: 600,
                }}
              >
                Joined Date
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
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                <td style={{ padding: "12px 16px" }}>
                  <Group gap="sm">
                    <Avatar src={u.avatarUrl} radius="xl" color="blue">
                      {u.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Text size="sm" fw={500}>
                        {u.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {u.email}
                      </Text>
                    </Box>
                  </Group>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge
                    variant="light"
                    color={
                      u.role === "ADMIN"
                        ? "red"
                        : u.role === "EDITOR"
                          ? "blue"
                          : "gray"
                    }
                  >
                    {u.role}
                  </Badge>
                </td>
                <td style={{ textAlign: "center", padding: "12px 16px" }}>
                  <Text size="sm" fw={600}>
                    {u.posts.length}
                  </Text>
                </td>
                <td style={{ textAlign: "right", padding: "12px 16px" }}>
                  <Text size="sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </Text>
                </td>
                <td style={{ textAlign: "right", padding: "12px 16px" }}>
                  {u.id !== currentUserId && (
                    <DeleteUserButton
                      userId={u.id}
                      userName={u.name || u.email}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Box>
  );
}

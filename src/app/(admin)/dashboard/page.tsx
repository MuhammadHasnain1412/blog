import { db } from "@/lib/prisma";
import { Title, SimpleGrid, Paper, Text, Group } from "@mantine/core";
import { IconFileText, IconFolders, IconUsers } from "@tabler/icons-react";
import { getCurrentUser, isAdmin } from "@/lib/rbac";
import { user_role } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getStats() {
  const [postCount, categoryCount, userCount] = await Promise.all([
    db.post.count(),
    db.category.count(),
    db.user.count(),
  ]);

  return { postCount, categoryCount, userCount };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const { postCount, categoryCount, userCount } = await getStats();
  const role = (user as any)?.role as user_role;

  return (
    <div>
      <Title order={2} mb="lg">
        Dashboard Overview
      </Title>

      <SimpleGrid cols={{ base: 1, sm: isAdmin(role) ? 3 : 2 }} spacing="lg">
        <StatCard
          title="Total Posts"
          value={postCount}
          icon={IconFileText}
          color="blue"
        />
        <StatCard
          title="Categories"
          value={categoryCount}
          icon={IconFolders}
          color="cyan"
        />
        {isAdmin(role) && (
          <StatCard
            title="Users"
            value={userCount}
            icon={IconUsers}
            color="teal"
          />
        )}
      </SimpleGrid>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} fz="xs">
            {title}
          </Text>
          <Text fw={700} fz="xl">
            {value}
          </Text>
        </div>
        <Icon
          size="1.4rem"
          color={`var(--mantine-color-${color}-6)`}
          stroke={1.5}
        />
      </Group>
    </Paper>
  );
}

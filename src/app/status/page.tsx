import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  ThemeIcon,
} from "@mantine/core";
import { IconCheck, IconRocket } from "@tabler/icons-react";
import Link from "next/link";

export default function Home() {
  return (
    <Container size="sm" py={80}>
      <Stack align="center" gap="lg">
        <ThemeIcon
          size={100}
          radius="xl"
          variant="gradient"
          gradient={{ from: "blue", to: "cyan", deg: 45 }}
        >
          <IconRocket size={50} stroke={1.5} />
        </ThemeIcon>

        <Title order={1} ta="center" fz={48} fw={900}>
          The Daily Mixa — Live! 🎉
        </Title>

        <Text c="dimmed" ta="center" size="lg" maw={500} mx="auto">
          All phases implemented. Next.js 14, Mantine UI, Prisma ORM, and RBAC
          are fully configured and ready to use.
        </Text>

        <Stack w="100%" gap="md" mt="xl">
          <PhaseItem
            title="Phase 1: Foundation"
            description="Project scaffolding, dependencies, and database schema."
            completed
          />
          <PhaseItem
            title="Phase 2: Authentication & RBAC"
            description="Setup NextAuth, User roles, and middleware protection."
            completed
          />
          <PhaseItem
            title="Phase 3: Admin Dashboard"
            description="Create the management interface for posts and categories."
            completed
          />
          <PhaseItem
            title="Phase 4: Public Frontend"
            description="Build the blog home, category pages, and post view."
            completed
          />
        </Stack>

        <Group mt="xl" justify="center">
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <Button size="lg" variant="light">
              Go to Admin Dashboard
            </Button>
          </Link>
          <Button
            component="a"
            href="https://mantine.dev"
            target="_blank"
            size="lg"
            variant="subtle"
            rel="noopener noreferrer"
          >
            Mantine Docs
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}

function PhaseItem({
  title,
  description,
  completed = false,
}: {
  title: string;
  description: string;
  completed?: boolean;
}) {
  return (
    <Group
      justify="space-between"
      p="md"
      style={{
        border: "1px solid var(--mantine-color-gray-3)",
        borderRadius: "var(--mantine-radius-md)",
        backgroundColor: completed
          ? "var(--mantine-color-blue-0)"
          : "transparent",
      }}
    >
      <Stack gap={4}>
        <Text fw={600} c={completed ? "blue" : "dimmed"}>
          {title}
        </Text>
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      </Stack>
      {completed ? (
        <ThemeIcon color="blue" variant="light" radius="xl">
          <IconCheck size={18} />
        </ThemeIcon>
      ) : (
        <ThemeIcon
          color="gray"
          variant="light"
          radius="xl"
          style={{ opacity: 0.3 }}
        >
          <IconCheck size={18} />
        </ThemeIcon>
      )}
    </Group>
  );
}

import {
  Container,
  Group,
  Title,
  Button,
  Box,
  Text,
  Stack,
  Divider,
  UnstyledButton,
} from "@mantine/core";
import Link from "next/link";
import { db } from "@/lib/prisma";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box bg="white" style={{ minHeight: "100vh" }}>
      {/* Top Header Bar */}
      <Box style={{ borderBottom: "1px solid #eee" }} py={8}>
        <Container size="xl">
          <Group justify="space-between">
            <Text size="xs" fw={500} c="dimmed">
              {today}
            </Text>
            <Group gap="xs">
              <Link href="/login" style={{ textDecoration: "none" }}>
                <Text size="xs" fw={600} c="dark">
                  Sign In
                </Text>
              </Link>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Brand Header */}
      <header>
        <Container size="xl" py={40}>
          <Stack align="center" gap={0}>
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <Title
                order={1}
                style={{
                  fontSize: "4.5rem",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
                ta="center"
              >
                The Daily Mixa
              </Title>
            </Link>
            <Divider my="md" w={100} color="dark" size="xl" />
          </Stack>
        </Container>
      </header>

      {/* Navigation Bar */}
      <Box
        component="nav"
        style={{
          borderTop: "1px solid #eee",
          borderBottom: "2px solid #000",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Container size="xl">
          <Box style={{ overflowX: "auto" }}>
            <Group gap="xl" h={50} justify="center" wrap="nowrap">
              <Link
                href="/"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Text
                  fw={700}
                  size="sm"
                  tt="uppercase"
                  style={{ whiteSpace: "nowrap" }}
                >
                  HOME
                </Text>
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Text
                    fw={700}
                    size="sm"
                    tt="uppercase"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {cat.name}
                  </Text>
                </Link>
              ))}
            </Group>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <main style={{ minHeight: "60vh" }}>{children}</main>

      {/* Simple Footer */}
      <footer
        style={{
          backgroundColor: "#f9f9f9",
          borderTop: "1px solid #eee",
          padding: "60px 0",
          marginTop: "80px",
        }}
      >
        <Container size="xl">
          <Stack align="center" gap="xl">
            <Title order={2} style={{ letterSpacing: "2px" }}>
              The Daily Mixa
            </Title>
            <Text c="dimmed" ta="center" maw={600} size="sm">
              Providing modern storytelling and global insights. Your source for
              World News, Celebrity updates, and more.
            </Text>
            <Group gap="xl">
              <Link
                href="/about"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Text size="xs" fw={700} tt="uppercase">
                  About Us
                </Text>
              </Link>
              <Link
                href="/contact"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Text size="xs" fw={700} tt="uppercase">
                  Contact
                </Text>
              </Link>
              <Link
                href="/archive"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Text size="xs" fw={700} tt="uppercase">
                  Archive
                </Text>
              </Link>
            </Group>
            <Divider w="100%" />
            <Text size="xs" c="dimmed">
              © {new Date().getFullYear()} The Daily Mixa. All rights reserved.
            </Text>
          </Stack>
        </Container>
      </footer>
    </Box>
  );
}

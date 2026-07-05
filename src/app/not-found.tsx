import type { Metadata } from "next";
import { Container, Title, Text, Button, Stack } from "@mantine/core";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container size="sm" py={120}>
      <Stack align="center" gap="lg">
        <Title
          order={1}
          style={{ fontSize: "6rem", letterSpacing: "4px" }}
          c="dimmed"
        >
          404
        </Title>
        <Title order={2} ta="center">
          Page Not Found
        </Title>
        <Text c="dimmed" ta="center" size="lg" maw={500}>
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </Text>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Button size="lg" color="dark" variant="outline">
            Back to Home
          </Button>
        </Link>
      </Stack>
    </Container>
  );
}

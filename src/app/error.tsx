"use client";

import { Container, Title, Text, Button, Stack } from "@mantine/core";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container size="sm" py={120}>
      <Stack align="center" gap="xl">
        <Title order={1} ta="center">
          Something went wrong
        </Title>
        <Text c="dimmed" ta="center" size="lg" maw={500}>
          We encountered an unexpected error. Please try again, or go back to
          the homepage.
        </Text>
        <Button onClick={reset} color="dark" size="md">
          Try Again
        </Button>
      </Stack>
    </Container>
  );
}

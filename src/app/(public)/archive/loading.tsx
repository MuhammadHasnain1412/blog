import { Container, Skeleton, SimpleGrid, Stack } from "@mantine/core";

export default function ArchiveLoading() {
  return (
    <Container size="xl" py={80}>
      <Skeleton height={40} width={200} mb="xl" />
      <Skeleton height={20} width={300} mb={40} />
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
        {Array.from({ length: 6 }).map((_, i) => (
          <Stack key={i} gap="sm">
            <Skeleton height={200} radius="sm" />
            <Skeleton height={20} width="85%" />
            <Skeleton height={14} width="60%" />
          </Stack>
        ))}
      </SimpleGrid>
    </Container>
  );
}

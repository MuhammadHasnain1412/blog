import { Container, Skeleton, Stack, Group } from "@mantine/core";

export default function PostLoading() {
  return (
    <Container size="md" py={60}>
      <Stack gap="xl">
        <Group gap="xs">
          <Skeleton height={16} width={50} />
          <Skeleton height={16} width={80} />
          <Skeleton height={16} width={120} />
        </Group>
        <Stack gap="md" align="center">
          <Skeleton height={28} width={120} />
          <Skeleton height={48} width="80%" />
          <Skeleton height={20} width="60%" />
          <Skeleton height={4} width={100} />
          <Group gap="xl">
            <Skeleton height={36} width={100} />
            <Skeleton height={36} width={120} />
            <Skeleton height={36} width={90} />
          </Group>
        </Stack>
        <Skeleton height={400} radius="sm" />
        <Container size="sm" p={0}>
          <Stack gap="md">
            <Skeleton height={16} />
            <Skeleton height={16} />
            <Skeleton height={16} width="80%" />
            <Skeleton height={16} />
            <Skeleton height={16} width="60%" />
          </Stack>
        </Container>
      </Stack>
    </Container>
  );
}

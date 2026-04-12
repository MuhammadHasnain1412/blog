import type { Metadata } from "next";
import {
  Container,
  Title,
  Text,
  Stack,
  Divider,
  SimpleGrid,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { IconNews, IconWorld, IconUsers } from "@tabler/icons-react";
import { absoluteUrl } from "@/lib/urls";

type FeatureIcon = typeof IconNews;

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about The Daily Mixa, our mission, and our editorial approach.",
  alternates: {
    canonical: absoluteUrl("/about"),
  },
  openGraph: {
    title: "About — The Daily Mixa",
    description:
      "Learn about The Daily Mixa, our mission, and our editorial approach.",
    url: absoluteUrl("/about"),
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <Container size="md" py={80}>
      <Stack gap="xl">
        <Stack align="center" gap="md" mb="xl">
          <Title
            order={1}
            style={{
              fontSize: "3rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            About The Daily Mixa
          </Title>
          <Divider w={100} size="xl" color="dark" />
        </Stack>

        <Text size="xl" lh={1.6} c="dimmed" ta="center">
          The Daily Mixa is a modern digital publication dedicated to bringing you the
          latest stories from around the globe. We believe in the power of
          storytelling to connect people, inspire change, and foster
          understanding.
        </Text>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={50} mt="xl">
          <Feature
            icon={IconNews}
            title="Unbiased Reporting"
            description="We are committed to delivering the facts with integrity and objectivity."
          />
          <Feature
            icon={IconWorld}
            title="Global Perspective"
            description="Our network of contributors spans continents to bring you diverse viewpoints."
          />
          <Feature
            icon={IconUsers}
            title="Community First"
            description="We build platforms for meaningful conversation and engagement."
          />
        </SimpleGrid>

        <Box mt={60}>
          <Title order={2} mb="lg" style={{ textTransform: "uppercase" }}>
            Our Mission
          </Title>
          <Text mb="md">
            Founded in 2024, The Daily Mixa has quickly grown from a small side project
            to a respected source of news and culture. Our mission is to
            democratize access to high-quality information and provide a
            platform for underrepresented voices.
          </Text>
          <Text>
            Whether it&apos;s breaking news, in-depth analysis, or cultural
            commentary, we strive to provide content that matters. Thank you for
            being part of our journey.
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: FeatureIcon;
  title: string;
  description: string;
}) {
  return (
    <Stack align="center" gap="xs">
      <ThemeIcon size={60} radius="md" variant="light" color="dark">
        <Icon size={32} stroke={1.5} />
      </ThemeIcon>
      <Title order={3} size="h4" mt="sm">
        {title}
      </Title>
      <Text c="dimmed" ta="center" size="sm">
        {description}
      </Text>
    </Stack>
  );
}

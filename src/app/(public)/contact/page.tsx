import type { Metadata } from "next";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  SimpleGrid,
  Box,
  Divider,
} from "@mantine/core";
import ContactForm from "./ContactForm";
import {
  IconMail,
  IconBrandTwitter,
  IconBrandYoutube,
  IconBrandInstagram,
} from "@tabler/icons-react";
import { absoluteUrl } from "@/lib/urls";

type ContactIconComponent = typeof IconMail;

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with The Daily Mixa editorial team.",
  alternates: {
    canonical: absoluteUrl("/contact"),
  },
  openGraph: {
    title: "Contact — The Daily Mixa",
    description: "Get in touch with The Daily Mixa editorial team.",
    url: absoluteUrl("/contact"),
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <Container size="xl" py={80}>
      <Title
        order={1}
        ta="center"
        mb="xl"
        style={{
          fontSize: "3rem",
          textTransform: "uppercase",
          letterSpacing: "2px",
        }}
      >
        Get in touch
      </Title>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={50}>
        {/* Contact Form Section */}
        <ContactForm />

        {/* Contact Info Section */}
        <Box>
          <Text c="dimmed" mb={40} size="lg">
            Have a news tip? Want to advertise with us? Or just want to say
            hello? We&apos;d love to hear from you. Fill out the form or reach us
            through our channels below.
          </Text>

          <SimpleGrid cols={1} spacing={30}>
            <ContactIcon
              title="Email"
              description="thedailymixa@gmail.com"
              icon={IconMail}
            />
          </SimpleGrid>

          <Divider my="xl" />

          <Group>
            <ActionIconWithLink icon={IconBrandTwitter} size={24} />
            <ActionIconWithLink icon={IconBrandYoutube} size={24} />
            <ActionIconWithLink icon={IconBrandInstagram} size={24} />
          </Group>
        </Box>
      </SimpleGrid>
    </Container>
  );
}

function ContactIcon({
  icon: Icon,
  title,
  description,
}: {
  icon: ContactIconComponent;
  title: string;
  description: string;
}) {
  return (
    <div>
      <Group align="flex-start">
        <Box
          p={10}
          bg="blue.0"
          style={{ borderRadius: "8px", color: "var(--mantine-color-blue-6)" }}
        >
          <Icon size={24} stroke={1.5} />
        </Box>
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fw={500} size="md">
            {description}
          </Text>
        </div>
      </Group>
    </div>
  );
}

function ActionIconWithLink({
  icon: Icon,
  size,
}: {
  icon: ContactIconComponent;
  size: number;
}) {
  return (
    <Button
      variant="outline"
      color="gray"
      radius="xl"
      size="md"
      px={10}
      style={{ border: "1px solid #eee" }}
    >
      <Icon size={size} stroke={1.5} />
    </Button>
  );
}

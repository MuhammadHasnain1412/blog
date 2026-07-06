"use client";

import { useState } from "react";
import {
  TextInput,
  Textarea,
  Button,
  Group,
  SimpleGrid,
  Paper,
  Title,
  Alert,
} from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper withBorder shadow="md" p={30} radius="md">
      <Title order={2} size="h3" mb="lg">
        Send us a message
      </Title>

      {status === "success" && (
        <Alert icon={<IconCheck size={16} />} color="green" mb="md">
          Message sent successfully! We&apos;ll get back to you soon.
        </Alert>
      )}
      {status === "error" && (
        <Alert icon={<IconX size={16} />} color="red" mb="md">
          Failed to send message. Please try again.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} mt="xl">
          <TextInput label="Name" name="name" placeholder="Your name" required />
          <TextInput label="Email" name="email" type="email" placeholder="your@email.com" required />
        </SimpleGrid>

        <TextInput
          label="Subject"
          name="subject"
          placeholder="Inquiry subject"
          mt="md"
          required
        />
        <Textarea
          mt="md"
          label="Message"
          name="message"
          placeholder="Your message"
          minRows={5}
          required
        />

        <Group justify="flex-end" mt="xl">
          <Button type="submit" size="md" color="dark" loading={loading}>
            Send message
          </Button>
        </Group>
      </form>
    </Paper>
  );
}

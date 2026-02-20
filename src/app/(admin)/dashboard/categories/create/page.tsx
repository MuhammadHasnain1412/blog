"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCategory } from "@/lib/actions";
import {
  Button,
  TextInput,
  Stack,
  Paper,
  Title,
  Alert,
  Group,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export default function CreateCategoryPage() {
  const [state, dispatch] = useActionState(createCategory, null);

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={3} mb="md">
        Create Category
      </Title>
      <form action={dispatch}>
        <Stack gap="md">
          {state?.message && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
            >
              {state.message}
            </Alert>
          )}

          <TextInput
            label="Category Name"
            name="name"
            placeholder="e.g. Technology"
            required
          />

          <Group justify="flex-end" mt="md">
            <SubmitButton />
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Save Category
    </Button>
  );
}

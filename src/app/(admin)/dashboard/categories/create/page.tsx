"use client";

import { createCategory } from "@/lib/actions";
import { useActionState } from "react";
import {
  TextInput,
  Button,
  Paper,
  Stack,
  Title,
  Alert,
  Container,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export default function CreateCategoryPage() {
  const [state, dispatch] = useActionState(createCategory, null);

  return (
    <Container size="sm">
      <Title order={2} mb="lg">
        Create New Category
      </Title>

      <Paper withBorder p="md" radius="md">
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
              placeholder="e.g. Technology, Health, Lifestyle"
              required
            />

            <Button type="submit" mt="md">
              Create Category
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import {
  Button,
  TextInput,
  PasswordInput,
  Paper,
  Container,
  Title,
  Alert,
  Stack,
} from "@mantine/core";
import { useActionState } from "react";
import { authenticate } from "@/lib/actions";
import { IconAlertCircle } from "@tabler/icons-react";

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);
  return (
    <Container size={420} my={40}>
      <Title ta="center" mb={30}>
        The Daily Mixa Login
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form action={dispatch}>
          <Stack>
            {errorMessage && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Error"
                color="red"
              >
                {errorMessage}
              </Alert>
            )}

            <TextInput
              label="Email"
              name="email"
              placeholder="you@mantine.dev"
              required
            />

            <PasswordInput
              label="Password"
              name="password"
              placeholder="Your password"
              required
              mt="md"
            />

            <LoginButton />
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button fullWidth mt="xl" type="submit" loading={pending}>
      Sign in
    </Button>
  );
}

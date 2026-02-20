"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { SessionProvider } from "next-auth/react";
import { theme } from "@/styles/theme";
import { Session } from "next-auth";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <MantineProvider theme={theme}>
        <Notifications position="top-right" zIndex={1000} />
        <ModalsProvider>{children}</ModalsProvider>
      </MantineProvider>
    </SessionProvider>
  );
}

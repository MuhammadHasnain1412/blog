"use client";

import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Title,
  Box,
  Divider,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconFileText,
  IconFolders,
  IconLogout,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { user_role } from "@prisma/client";

export default function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role: user_role | string;
  } | null;
}) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  const links = [
    {
      icon: IconDashboard,
      label: "Dashboard",
      href: "/dashboard",
      exact: true,
    },
    { icon: IconFileText, label: "Posts", href: "/dashboard/posts" },
    {
      icon: IconFolders,
      label: "Categories",
      href: "/dashboard/categories",
    },
  ];

  // Only show Users link to Admins
  if (user?.role === "ADMIN") {
    links.push({
      icon: IconUsers,
      label: "Users",
      href: "/dashboard/users",
    });
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={3}>The Daily Mixa</Title>
          </Group>
          <Group visibleFrom="sm" px="md">
            {user && (
              <Badge
                variant="outline"
                color={user.role === "ADMIN" ? "red" : "blue"}
              >
                {user.role}
              </Badge>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Box mb="md">
          <Text size="xs" fw={500} c="dimmed" mb="sm">
            MENU
          </Text>
          {links.map((link) => (
            <NavLink
              key={link.label}
              component={Link}
              href={link.href}
              label={link.label}
              leftSection={<link.icon size="1rem" stroke={1.5} />}
              active={
                link.exact
                  ? pathname === link.href
                  : pathname === link.href ||
                    pathname.startsWith(link.href + "/")
              }
              variant="filled"
              onClick={() => {
                if (window.innerWidth < 768) toggle(); // Close on mobile click
              }}
            />
          ))}
        </Box>

        <Box style={{ marginTop: "auto" }}>
          {user && (
            <Box
              mb="md"
              p="xs"
              style={{ background: "#f8f9fa", borderRadius: "8px" }}
            >
              <Group gap="xs">
                <IconUserCircle size={32} stroke={1.5} color="gray" />
                <div>
                  <Text size="sm" fw={700} lineClamp={1}>
                    {user.name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {user.email}
                  </Text>
                </div>
              </Group>
              <Badge
                fullWidth
                mt="sm"
                size="xs"
                variant="light"
                color={user.role === "ADMIN" ? "red" : "blue"}
              >
                {user.role} Account
              </Badge>
            </Box>
          )}
          <Divider mb="sm" />
          <NavLink
            label="Logout"
            leftSection={<IconLogout size="1rem" stroke={1.5} />}
            color="red"
            variant="subtle"
            onClick={() => signOut()}
          />
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

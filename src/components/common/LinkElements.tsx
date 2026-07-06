"use client";

/**
 * Client wrappers for Mantine elements that navigate via next/link.
 *
 * Server Components cannot pass `component={Link}` to Mantine components —
 * functions are not serializable across the server/client boundary, which
 * crashes dynamic (logged-in) renders with:
 * "Functions cannot be passed directly to Client Components".
 */

import Link from "next/link";
import {
  Anchor,
  Button,
  type AnchorProps,
  type ButtonProps,
} from "@mantine/core";
import type { ReactNode } from "react";

export function LinkAnchor({
  href,
  children,
  ...props
}: AnchorProps & { href: string; children: ReactNode }) {
  return (
    <Anchor component={Link} href={href} {...props}>
      {children}
    </Anchor>
  );
}

export function LinkButton({
  href,
  children,
  ...props
}: ButtonProps & { href: string; children: ReactNode }) {
  return (
    <Button component={Link} href={href} {...props}>
      {children}
    </Button>
  );
}

"use client";

import { Group, ActionIcon, CopyButton, Tooltip } from "@mantine/core";
import {
  IconBrandWhatsapp,
  IconBrandX,
  IconBrandFacebook,
  IconLink,
  IconCheck,
} from "@tabler/icons-react";

export default function ShareButtons({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <Group gap="xs">
      <Tooltip label="Share on WhatsApp">
        <ActionIcon
          component="a"
          href={`https://wa.me/?text=${encodedTitle}%20${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="subtle"
          color="green"
          size="lg"
        >
          <IconBrandWhatsapp size={20} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Share on X">
        <ActionIcon
          component="a"
          href={`https://x.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="subtle"
          color="dark"
          size="lg"
        >
          <IconBrandX size={20} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Share on Facebook">
        <ActionIcon
          component="a"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="subtle"
          color="blue"
          size="lg"
        >
          <IconBrandFacebook size={20} />
        </ActionIcon>
      </Tooltip>
      <CopyButton value={url}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? "Copied!" : "Copy link"}>
            <ActionIcon
              onClick={copy}
              variant="subtle"
              color={copied ? "teal" : "gray"}
              size="lg"
            >
              {copied ? <IconCheck size={20} /> : <IconLink size={20} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
}

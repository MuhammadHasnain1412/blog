"use client";

import { ActionIcon, Menu } from "@mantine/core";
import { IconDots, IconEye, IconPencil } from "@tabler/icons-react";
import Link from "next/link";
import DeletePostMenuItem from "@/components/admin/DeletePostMenuItem";
import { postUrl } from "@/lib/urls";

interface PostActionsProps {
  post: {
    id: string;
    title: string;
    slug: string;
    category: {
      slug: string;
    };
  };
  canEdit: boolean;
  canDelete: boolean;
}

export default function PostActions({
  post,
  canEdit,
  canDelete,
}: PostActionsProps) {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconEye size={16} />}
          component="a"
          href={postUrl(post.slug)}
          target="_blank"
        >
          View Live
        </Menu.Item>

        {canEdit && (
          <Menu.Item
            leftSection={<IconPencil size={16} />}
            component={Link}
            href={`/dashboard/posts/${post.id}`}
          >
            Edit
          </Menu.Item>
        )}

        {canDelete && (
          <DeletePostMenuItem postId={post.id} postTitle={post.title} />
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

"use client";

import { Menu, Text } from "@mantine/core";
import { IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import { deletePost } from "@/lib/actions";
import { useTransition } from "react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

export default function DeletePostMenuItem({
  postId,
  postTitle,
}: {
  postId: string;
  postTitle: string;
}) {
  const [isPending, startTransition] = useTransition();

  const openDeleteModal = () =>
    modals.openConfirmModal({
      title: "Delete News Story",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete <b>"{postTitle}"</b>? This will
          permanently remove the story from the public blog and the database.
        </Text>
      ),
      labels: { confirm: "Delete Post", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        startTransition(async () => {
          const result = await deletePost(postId);

          if (result?.message === "Post deleted successfully") {
            notifications.show({
              title: "Post Deleted",
              message: `"${postTitle}" has been removed.`,
              color: "green",
              icon: <IconCheck size={16} />,
            });
          } else {
            notifications.show({
              title: "Error",
              message: result?.message || "Failed to delete post.",
              color: "red",
              icon: <IconX size={16} />,
            });
          }
        });
      },
    });

  return (
    <Menu.Item
      leftSection={<IconTrash size={16} />}
      color="red"
      onClick={openDeleteModal}
      disabled={isPending}
    >
      {isPending ? "Deleting..." : "Delete"}
    </Menu.Item>
  );
}

"use client";

import { ActionIcon, Tooltip, Text } from "@mantine/core";
import { IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import { deleteUser } from "@/lib/actions";
import { useTransition } from "react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

export default function DeleteUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const openDeleteModal = () =>
    modals.openConfirmModal({
      title: "Delete User Account",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete the account for <b>{userName}</b>?
          This action is permanent and all associated data may be affected.
        </Text>
      ),
      labels: { confirm: "Delete User", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        startTransition(async () => {
          const result = await deleteUser(userId);

          if (result?.message === "User deleted successfully") {
            notifications.show({
              title: "User Removed",
              message: `Successfully deleted user ${userName}`,
              color: "green",
              icon: <IconCheck size={16} />,
            });
          } else {
            notifications.show({
              title: "Delete Failed",
              message: result?.message || "Something went wrong",
              color: "red",
              icon: <IconX size={16} />,
            });
          }
        });
      },
    });

  return (
    <Tooltip label="Delete User">
      <ActionIcon
        variant="subtle"
        color="red"
        onClick={openDeleteModal}
        loading={isPending}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Tooltip>
  );
}

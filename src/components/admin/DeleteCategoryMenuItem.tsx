"use client";

import { Menu, Text } from "@mantine/core";
import { IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import { deleteCategory } from "@/lib/actions";
import { useTransition } from "react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

export default function DeleteCategoryMenuItem({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const openDeleteModal = () =>
    modals.openConfirmModal({
      title: "Delete Category",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete the category{" "}
          <b>&quot;{categoryName}&quot;</b>? This action can only be completed
          if the category contains no stories.
        </Text>
      ),
      labels: { confirm: "Delete Category", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        startTransition(async () => {
          const result = await deleteCategory(null, { id: categoryId });

          if (
            result?.data?.message === "Category deleted successfully" ||
            (result.success && result.message === undefined)
          ) {
            notifications.show({
              title: "Category Deleted",
              message: `"${categoryName}" has been removed.`,
              color: "green",
              icon: <IconCheck size={16} />,
            });
          } else {
            notifications.show({
              title: "Action Blocked",
              message: result?.message || "Failed to delete category.",
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

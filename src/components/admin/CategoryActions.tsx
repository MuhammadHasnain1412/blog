"use client";

import { ActionIcon, Menu } from "@mantine/core";
import { IconDots, IconPencil } from "@tabler/icons-react";
import Link from "next/link";
import DeleteCategoryMenuItem from "@/components/admin/DeleteCategoryMenuItem";

interface CategoryActionsProps {
  category: {
    id: string;
    name: string;
  };
  canEdit: boolean;
  canDelete: boolean;
}

export default function CategoryActions({
  category,
  canEdit,
  canDelete,
}: CategoryActionsProps) {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {canEdit && (
          <Menu.Item
            leftSection={<IconPencil size={16} />}
            component={Link}
            href={`/dashboard/categories/${category.id}`}
          >
            Edit
          </Menu.Item>
        )}

        {canDelete && (
          <DeleteCategoryMenuItem
            categoryId={category.id}
            categoryName={category.name}
          />
        )}
      </Menu.Dropdown>
    </Menu>
  );
}

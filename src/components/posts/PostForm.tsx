"use client";

import { createPost, updatePost } from "@/lib/actions";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  TextInput,
  Select,
  Stack,
  Paper,
  Alert,
  Group,
  Input,
  FileInput,
} from "@mantine/core";
import { IconAlertCircle, IconUpload } from "@tabler/icons-react";
import dynamic from "next/dynamic";

const TipTapEditor = dynamic(() => import("@/components/editor/TipTapEditor"), {
  ssr: false, // Tiptap is client-only
  loading: () => <p>Loading editor...</p>,
});

export default function PostForm({
  categories,
  initialData,
}: {
  categories: { id: string; name: string }[];
  initialData?: any;
}) {
  const isEditing = !!initialData;
  const action = isEditing ? updatePost.bind(null, initialData.id) : createPost;

  const [state, dispatch] = useActionState(action, null);
  const [content, setContent] = useState(initialData?.content || "");

  return (
    <Paper withBorder p="md" radius="md">
      <form action={dispatch}>
        <Stack gap="md">
          {state?.message && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
            >
              {state.message}
            </Alert>
          )}

          <TextInput
            label="Title"
            name="title"
            placeholder="Post Title"
            defaultValue={initialData?.title}
            required
          />

          <TextInput
            label="Excerpt"
            name="excerpt"
            placeholder="Brief summary of the post"
            description="Displayed on the home page and category lists."
            defaultValue={initialData?.excerpt}
          />

          <Group grow align="flex-start">
            <FileInput
              label="Cover Image"
              name="coverImage"
              placeholder={isEditing ? "Change thumbnail" : "Upload thumbnail"}
              description="Recommended size: 1200x630"
              leftSection={<IconUpload size={16} />}
              accept="image/*"
              clearable
            />

            <Select
              label="Category"
              name="categoryId"
              data={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
              defaultValue={initialData?.categoryId}
              required
              searchable
            />

            <Select
              label="Status"
              name="status"
              defaultValue={initialData?.status || "DRAFT"}
              data={["DRAFT", "PUBLISHED", "ARCHIVED"]}
              required
            />
          </Group>

          <Input.Wrapper
            label="Content"
            description="Write your post content here"
            required
          >
            <TipTapEditor value={content} onChange={setContent} />
            <input type="hidden" name="content" value={content} />
          </Input.Wrapper>

          <Group justify="flex-end" mt="md">
            <SubmitButton isEditing={isEditing} />
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" loading={pending}>
      {isEditing ? "Update Post" : "Save Post"}
    </Button>
  );
}

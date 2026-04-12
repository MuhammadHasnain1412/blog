import { db } from "@/lib/prisma";
import PostForm from "@/components/posts/PostForm";
import { Title, Container, Stack, Breadcrumbs, Text } from "@mantine/core";
import { getCurrentUser, canEditPost } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const post = await db.post.findUnique({
    where: { id },
  });

  if (!post) notFound();

  if (!canEditPost(user, post.authorId)) {
    redirect("/dashboard/posts");
  }

  const categories = await db.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Breadcrumbs>
          <Link
            href="/dashboard"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/posts"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            Posts
          </Link>
          <Text size="sm">Edit Post</Text>
        </Breadcrumbs>

        <Title order={2}>Edit Post</Title>

        <PostForm categories={categories} initialData={post} />
      </Stack>
    </Container>
  );
}

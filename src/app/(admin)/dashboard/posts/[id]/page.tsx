import { db } from "@/lib/prisma";
import PostForm from "@/components/posts/PostForm";
import {
  Title,
  Container,
  Stack,
  Breadcrumbs,
  Anchor,
  Text,
} from "@mantine/core";
import { getCurrentUser, canEditPost } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { user_role } from "@prisma/client";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const post = await db.post.findUnique({
    where: { id: params.id },
  });

  if (!post) notFound();

  // Permission Check
  const userRole = (user as any).role as user_role;
  const userSession = {
    id: (user as any).id,
    email: user.email!,
    role: userRole,
  };

  if (!canEditPost(userSession, post.authorId)) {
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
          <Anchor component={Link} href="/dashboard">
            Dashboard
          </Anchor>
          <Anchor component={Link} href="/dashboard/posts">
            Posts
          </Anchor>
          <Text size="sm">Edit Post</Text>
        </Breadcrumbs>

        <Title order={2}>Edit Post</Title>

        <PostForm categories={categories} initialData={post} />
      </Stack>
    </Container>
  );
}

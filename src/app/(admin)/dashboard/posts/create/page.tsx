import { db } from "@/lib/prisma";
import { Title } from "@mantine/core";
import PostForm from "@/components/posts/PostForm";

export const dynamic = "force-dynamic";

export default async function CreatePostPage() {
  const categories = await db.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Title order={2} mb="lg">
        Create New Post
      </Title>
      <PostForm categories={categories} />
    </div>
  );
}

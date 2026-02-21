"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/prisma";
import { getCurrentUser, canPublish, canManageCategories } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { post_status, user_role } from "@prisma/client";
import { writeFile } from "fs/promises";
import path from "path";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          console.error(error);
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

const PostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().min(1, "Category is required"),
  status: z.nativeEnum(post_status),
  excerpt: z.string().optional(),
});

export async function createPost(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.email) return { message: "Unauthorized" };

  const userId = (user as any).id;
  const userRole = (user as any).role as user_role;

  const rawData = {
    title: formData.get("title"),
    content: formData.get("content"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status"),
    excerpt: formData.get("excerpt"),
  };

  const validated = PostSchema.safeParse(rawData);

  if (!validated.success) {
    return { message: validated.error.issues[0].message };
  }

  const { title, content, categoryId, status, excerpt } = validated.data;

  // Handle Cover Image Upload
  const file = formData.get("coverImage") as File;
  let coverImage = null;

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;
    const uploadPath = path.join(process.cwd(), "public", "uploads", filename);

    try {
      await writeFile(uploadPath, buffer);
      coverImage = `/uploads/${filename}`;
    } catch (err) {
      console.error("Error saving file:", err);
    }
  }

  // Basic Slug generation
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const uniqueSlug = `${slug}-${Date.now()}`;

  // RBAC Check
  if (status === post_status.PUBLISHED && !canPublish(userRole)) {
    return {
      message:
        "You do not have permission to publish posts directly. Save as DRAFT.",
    };
  }

  try {
    await db.post.create({
      data: {
        title,
        slug: uniqueSlug,
        content,
        excerpt,
        coverImage,
        categoryId,
        status,
        authorId: userId,
        lastUpdatedById: userId, // Initially updated by author
        publishedAt: status === post_status.PUBLISHED ? new Date() : null,
      },
    });
  } catch (e) {
    console.error(e);
    return { message: "Database error: Failed to create post." };
  }

  revalidatePath("/dashboard/posts");
  revalidatePath("/");
  redirect("/dashboard/posts");
}

export async function updatePost(
  postId: string,
  prevState: any,
  formData: FormData,
) {
  const user = await getCurrentUser();
  if (!user || !user.email) return { message: "Unauthorized" };

  const userId = (user as any).id;
  const userRole = (user as any).role as user_role;

  // 1. Check if post exists & if user has permission to edit
  const existingPost = await db.post.findUnique({ where: { id: postId } });
  if (!existingPost) return { message: "Post not found" };

  const isAuthor = existingPost.authorId === userId;
  const isPrivileged =
    userRole === user_role.ADMIN || userRole === user_role.EDITOR;

  if (!isAuthor && !isPrivileged) {
    return { message: "Access denied" };
  }

  // 2. Validate data
  const rawData = {
    title: formData.get("title"),
    content: formData.get("content"),
    categoryId: formData.get("categoryId"),
    status: formData.get("status"),
    excerpt: formData.get("excerpt"),
  };

  const validated = PostSchema.safeParse(rawData);
  if (!validated.success) {
    return { message: validated.error.issues[0].message };
  }

  const { title, content, categoryId, status, excerpt } = validated.data;

  // 3. Handle Cover Image (optional update)
  const file = formData.get("coverImage") as File;
  let coverImage = existingPost.coverImage;

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;
    const uploadPath = path.join(process.cwd(), "public", "uploads", filename);
    await writeFile(uploadPath, buffer);
    coverImage = `/uploads/${filename}`;
  }

  // 4. Update Database
  try {
    await db.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        excerpt,
        coverImage,
        categoryId,
        status,
        lastUpdatedById: userId, // Track WHO edited this
        publishedAt:
          status === post_status.PUBLISHED && !existingPost.publishedAt
            ? new Date()
            : existingPost.publishedAt,
      },
    });
  } catch (e) {
    console.error(e);
    return { message: "Database error: Failed to update post." };
  }

  revalidatePath("/dashboard/posts");
  revalidatePath("/");
  redirect("/dashboard/posts");
}

const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function createCategory(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.email) return { message: "Unauthorized" };

  const role = (user as any).role as user_role;

  if (!canManageCategories(role)) {
    return {
      message:
        "Insufficient permissions. Only Admins and Editors can manage categories.",
    };
  }

  const name = formData.get("name") as string;
  const validated = CategorySchema.safeParse({ name });

  if (!validated.success) {
    return { message: validated.error.issues[0].message };
  }

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-");
  const uniqueSlug = `${slug}-${Date.now().toString().slice(-4)}`;

  try {
    await db.category.create({
      data: {
        name,
        slug: uniqueSlug,
      },
    });
  } catch (e) {
    console.error(e);
    return { message: "Failed to create category" };
  }

  revalidatePath("/dashboard/categories");
  redirect("/dashboard/categories");
}

export async function deleteUser(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser as any).role !== user_role.ADMIN) {
    return { message: "Unauthorized" };
  }

  // Prevent self-deletion
  if ((currentUser as any).id === userId) {
    return { message: "You cannot delete your own account." };
  }

  try {
    // Note: We might need to handle cascading deletes or nullify relations
    // depending on database constraints, but for now we'll attempt deletion.
    await db.user.delete({
      where: { id: userId },
    });
  } catch (e) {
    console.error(e);
    return { message: "Failed to delete user. They may have active posts." };
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  return { message: "User deleted successfully" };
}

export async function deletePost(postId: string) {
  const user = await getCurrentUser();
  if (!user || (user as any).role !== user_role.ADMIN) {
    return { message: "Unauthorized" };
  }

  try {
    await db.post.delete({
      where: { id: postId },
    });
  } catch (e) {
    console.error(e);
    return { message: "Failed to delete post." };
  }

  revalidatePath("/dashboard/posts");
  revalidatePath("/");
  return { message: "Post deleted successfully" };
}

export async function deleteCategory(categoryId: string) {
  const user = await getCurrentUser();
  if (!user || (user as any).role !== user_role.ADMIN) {
    return { message: "Unauthorized" };
  }

  try {
    // Check if category has posts
    const postCount = await db.post.count({
      where: { categoryId },
    });

    if (postCount > 0) {
      return {
        message:
          "Cannot delete category with associated posts. Move or delete the posts first.",
      };
    }

    await db.category.delete({
      where: { id: categoryId },
    });
  } catch (e) {
    console.error(e);
    return { message: "Failed to delete category." };
  }

  revalidatePath("/dashboard/categories");
  return { message: "Category deleted successfully" };
}

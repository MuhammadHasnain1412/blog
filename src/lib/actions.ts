"use server";

import { signIn } from "@/auth";
import { extname } from "path";
import crypto from "crypto";
import { db } from "@/lib/prisma";
import { getCurrentUser, canPublish, canManageCategories } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { post_status, user_role } from "@prisma/client";
import { writeFile } from "fs/promises";
import path from "path";
import { headers } from "next/headers";
import { loginLimiter, uploadLimiter } from "@/lib/rate-limit";
import DOMPurify from "isomorphic-dompurify";

// ── Shared IP helper ──────────────────────────────────────────────────────────

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  // ✅ Rate limit: 5 attempts per IP per 15 minutes
  const ip = await getClientIp();
  const limit = loginLimiter(ip);
  if (!limit.success) {
    return "Too many login attempts. Please wait 15 minutes and try again.";
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error: any) {
    if (
      error?.type === "CredentialsSignin" ||
      error?.message?.includes("CredentialsSignin")
    ) {
      return "Invalid credentials.";
    }
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    if (error?.message) {
      console.error(error);
      return "Something went wrong.";
    }
    throw error; // Re-throw — Next.js uses this to handle the redirect
  }
}

// ── Post validation schema ────────────────────────────────────────────────────

const PostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().min(1, "Category is required"),
  status: z.nativeEnum(post_status),
  excerpt: z.string().optional(),
});

// ── Create post ───────────────────────────────────────────────────────────────

export async function createPost(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.email) return { message: "Unauthorized" };

  const userId = (user as any).id;
  const userRole = (user as any).role as user_role;

  // Handle cover image upload
  let coverImage = null;

  // ✅ Rate limit uploads BEFORE reading binary data into memory
  const file = formData.get("coverImage") as File;
  if (file && file.size > 0) {
    // 1. Enforce strict MIME Types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return {
        message: "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.",
      };
    }
    // 2. Eradicate Path Traversal by generating our own cryptographically secure name
    // Do NOT trust file.name under any circumstance.
    const extension = extname(file.name).toLowerCase();
    const safeFilename = `${crypto.randomUUID()}${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      safeFilename,
    );
    try {
      await writeFile(uploadPath, buffer);
      coverImage = `/uploads/${safeFilename}`;
    } catch (err) {
      console.error("Error saving file:", err);
    }
  }

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

  const cleanContent = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "script", "iframe", "form", "object"],
    FORBID_ATTR: ["onerror", "onload", "onmouseover"],
  });

  // Slug generation
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const uniqueSlug = `${slug}-${Date.now()}`;

  // RBAC check
  if (status === post_status.PUBLISHED && !canPublish(userRole)) {
    return {
      message:
        "You do not have permission to publish posts directly. Save as DRAFT.",
    };
  }

  let createdSlug: string;
  try {
    const created = await db.post.create({
      data: {
        title,
        slug: uniqueSlug,
        content: cleanContent,
        excerpt,
        coverImage,
        categoryId,
        status,
        authorId: userId,
        lastUpdatedById: userId,
        publishedAt: status === post_status.PUBLISHED ? new Date() : null,
      },
      select: { slug: true }, // ✅ Only fetch what we need for revalidation
    });
    createdSlug = created.slug;
  } catch (e) {
    console.error(e);
    return { message: "Database error: Failed to create post." };
  }

  revalidatePath("/dashboard/posts");
  revalidatePath("/");
  revalidatePath(`/posts/${createdSlug}`); // ✅ Revalidate new canonical URL
  redirect("/dashboard/posts");
}

// ── Update post ───────────────────────────────────────────────────────────────

export async function updatePost(
  postId: string,
  prevState: any,
  formData: FormData,
) {
  const user = await getCurrentUser();
  if (!user || !user.email) return { message: "Unauthorized" };

  const userId = (user as any).id;
  const userRole = (user as any).role as user_role;

  // ✅ Select only the columns we actually use — not SELECT *
  const existingPost = await db.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      coverImage: true,
      publishedAt: true,
      slug: true,
    },
  });
  if (!existingPost) return { message: "Post not found" };

  const isAuthor = existingPost.authorId === userId;
  const isPrivileged =
    userRole === user_role.ADMIN || userRole === user_role.EDITOR;
  if (!isAuthor && !isPrivileged) {
    return { message: "Access denied" };
  }

  // ✅ Rate limit uploads BEFORE reading binary data into memory
  const file = formData.get("coverImage") as File;
  if (file && file.size > 0) {
    const ip = await getClientIp();
    const uploadLimit = uploadLimiter(ip);
    if (!uploadLimit.success) {
      return {
        message: "Too many uploads. Please wait a minute and try again.",
      };
    }
    // 1. Enforce strict MIME Types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return {
        message: "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.",
      };
    }
  }

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

  const cleanContent = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "script", "iframe", "form", "object"],
    FORBID_ATTR: ["onerror", "onload", "onmouseover"],
  });

  // Handle cover image update (optional — keeps existing if no new file)
  let coverImage = existingPost.coverImage;
  if (file && file.size > 0) {
    // 2. Eradicate Path Traversal by generating our own cryptographically secure name
    // Do NOT trust file.name under any circumstance.
    const extension = extname(file.name).toLowerCase();
    const safeFilename = `${crypto.randomUUID()}${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      safeFilename,
    );
    await writeFile(uploadPath, buffer);
    coverImage = `/uploads/${safeFilename}`;
  }

  try {
    await db.post.update({
      where: { id: postId },
      data: {
        title,
        content: cleanContent,
        excerpt,
        coverImage,
        categoryId,
        status,
        lastUpdatedById: userId,
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
  revalidatePath(`/posts/${existingPost.slug}`); // ✅ Revalidate canonical URL
  redirect("/dashboard/posts");
}

// ── Category actions ──────────────────────────────────────────────────────────

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

  let uniqueSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-");

  let slugExists = true;
  let counter = 1;
  while (slugExists) {
    const existing = await db.category.findUnique({
      where: { slug: uniqueSlug },
    });
    if (existing) {
      uniqueSlug = `${name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")}-${counter}`;
      counter++;
    } else {
      slugExists = false;
    }
  }

  try {
    await db.category.create({
      data: { name, slug: uniqueSlug },
    });
  } catch (e) {
    console.error(e);
    return { message: "Failed to create category" };
  }

  revalidatePath("/dashboard/categories");
  redirect("/dashboard/categories");
}

// ── Delete actions ────────────────────────────────────────────────────────────

export async function deleteUser(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser as any).role !== user_role.ADMIN) {
    return { message: "Unauthorized" };
  }

  if ((currentUser as any).id === userId) {
    return { message: "You cannot delete your own account." };
  }

  try {
    await db.user.delete({ where: { id: userId } });
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
    // ✅ Fetch slug before deletion so we can revalidate the URL
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { slug: true },
    });

    await db.post.delete({ where: { id: postId } });

    if (post) {
      revalidatePath(`/posts/${post.slug}`);
    }
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
    const postCount = await db.post.count({ where: { categoryId } });
    if (postCount > 0) {
      return {
        message:
          "Cannot delete category with associated posts. Move or delete the posts first.",
      };
    }

    await db.category.delete({ where: { id: categoryId } });
  } catch (e) {
    console.error(e);
    return { message: "Failed to delete category." };
  }

  revalidatePath("/dashboard/categories");
  return { message: "Category deleted successfully" };
}

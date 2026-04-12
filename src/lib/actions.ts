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
import { headers } from "next/headers";
import { loginLimiter, uploadLimiter } from "@/lib/rate-limit";
import DOMPurify from "isomorphic-dompurify";
import { createSafeAction } from "@/lib/safe-action";
import { assertS3Configured } from "@/lib/env";
import { uploadToS3 } from "@/lib/s3";

// ── Shared IP helper ──────────────────────────────────────────────────────────

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  // ✅ Prioritize provider-authenticated headers that cannot be spoofed by the client
  return (
    headersList.get("x-vercel-forwarded-for") ??
    headersList.get("cf-connecting-ip") ??
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
  } catch (error: unknown) {
    const err = error as { type?: string; message?: string; digest?: string };
    if (
      err.type === "CredentialsSignin" ||
      err.message?.includes("CredentialsSignin")
    ) {
      return "Invalid credentials.";
    }
    if (err.digest) {
      throw error;
    }
    if (err.message) {
      console.error(err.message);
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

export const createPost = createSafeAction(
  PostSchema,
  async (
    validatedData,
    userId,
    formData: FormData | Record<string, unknown>,
  ) => {
    let coverImage = null;
    const file =
      formData instanceof FormData
        ? ((formData as FormData).get("coverImage") as File)
        : null;
    if (file && file.size > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          "File payload is too large. Maximum upload size allowed is 5MB.",
        );
      }
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.",
        );
      }

      try {
        assertS3Configured();
        const uniqueName =
          crypto.randomUUID() + extname(file.name).toLowerCase();
        coverImage = await uploadToS3(`uploads/${uniqueName}`, file);
      } catch (err) {
        console.error("[createPost] Image upload skipped or failed:", err);
        // We don't throw here so the user can still save the text content
        // even if image storage is not configured yet.
      }
    }

    const { title, content, categoryId, status, excerpt } = validatedData;
    const userRole = (await db.user.findUnique({ where: { id: userId } }))
      ?.role as user_role;

    const cleanContent = DOMPurify.sanitize(content, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["style", "script", "iframe", "form", "object"],
      FORBID_ATTR: ["onerror", "onload", "onmouseover"],
    });

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const uniqueSlug = `${slug}-${Date.now()}`;

    // RBAC check
    if (status === post_status.PUBLISHED && !canPublish(userRole)) {
      throw new Error(
        "You do not have permission to publish posts directly. Save as DRAFT.",
      );
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
        select: { slug: true },
      });
      createdSlug = created.slug;
    } catch (e) {
      console.error(e);
      throw new Error("Database error: Failed to create post.");
    }

    revalidatePath("/dashboard/posts");
    revalidatePath("/");
    revalidatePath(`/posts/${createdSlug}`);
    redirect("/dashboard/posts");
  },
);

// ── Update post ───────────────────────────────────────────────────────────────

const UpdatePostSchema = PostSchema.extend({
  postId: z.string().min(1, "Post ID is required"),
});

export const updatePost = createSafeAction(
  UpdatePostSchema,
  async (
    validatedData,
    userId,
    formData: FormData | Record<string, unknown>,
  ) => {
    const { title, content, categoryId, status, excerpt, postId } =
      validatedData;

    // DB check
    const existingPost = await db.post.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        coverImage: true,
        publishedAt: true,
        slug: true,
      },
    });
    if (!existingPost) throw new Error("Post not found");

    const userRecord = await db.user.findUnique({ where: { id: userId } });
    const userRole = userRecord?.role as user_role;

    const isAuthor = existingPost.authorId === userId;
    const isPrivileged =
      userRole === user_role.ADMIN || userRole === user_role.EDITOR;

    if (!isAuthor && !isPrivileged) {
      throw new Error("Access denied");
    }

    // RBAC check
    if (status === post_status.PUBLISHED && !canPublish(userRole)) {
      throw new Error(
        "You do not have permission to publish posts directly. Save as DRAFT.",
      );
    }

    // Handle file upload
    let coverImage = existingPost.coverImage;
    const file =
      formData instanceof FormData
        ? ((formData as FormData).get("coverImage") as File)
        : null;
    if (file && file.size > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          "File payload is too large. Maximum upload size allowed is 5MB.",
        );
      }

      const ip = await getClientIp();
      const uploadLimit = uploadLimiter(ip);
      if (!uploadLimit.success) {
        throw new Error(
          "Too many uploads. Please wait a minute and try again.",
        );
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.",
        );
      }

      try {
        assertS3Configured();
        const uniqueName =
          crypto.randomUUID() + extname(file.name).toLowerCase();
        coverImage = await uploadToS3(`uploads/${uniqueName}`, file);
      } catch (err) {
        console.error("[updatePost] Image upload skipped or failed:", err);
      }
    }

    const cleanContent = DOMPurify.sanitize(content, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["style", "script", "iframe", "form", "object"],
      FORBID_ATTR: ["onerror", "onload", "onmouseover"],
    });

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
      throw new Error("Database error: Failed to update post.");
    }

    revalidatePath("/dashboard/posts");
    revalidatePath("/");
    revalidatePath(`/posts/${existingPost.slug}`);
    redirect("/dashboard/posts");
  },
);

// ── Category actions ──────────────────────────────────────────────────────────

const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const createCategory = createSafeAction(
  CategorySchema,
  async (validatedData) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    const role = user.role;

    if (!canManageCategories(role)) {
      throw new Error(
        "Insufficient permissions. Only Admins and Editors can manage categories.",
      );
    }

    const { name } = validatedData;
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
      throw new Error("Failed to create category");
    }

    revalidatePath("/dashboard/categories");
    redirect("/dashboard/categories");
  },
);

// ── Delete actions ────────────────────────────────────────────────────────────

export const deleteUser = createSafeAction(
  z.object({ id: z.string() }),
  async ({ id: targetUserId }, userId) => {
    const currentUser = await db.user.findUnique({ where: { id: userId } });
    if (!currentUser || currentUser.role !== user_role.ADMIN) {
      return { message: "Unauthorized" };
    }

    if (currentUser.id === targetUserId) {
      return { message: "You cannot delete your own account." };
    }

    try {
      await db.user.delete({ where: { id: targetUserId } });
    } catch (e) {
      console.error(e);
      return { message: "Failed to delete user. They may have active posts." };
    }

    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard");
    return { message: "User deleted successfully" };
  },
);

export const deletePost = createSafeAction(
  z.object({ id: z.string() }),
  async ({ id: postId }, userId) => {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== user_role.ADMIN) {
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
  },
);

export const deleteCategory = createSafeAction(
  z.object({ id: z.string() }),
  async ({ id: categoryId }, userId) => {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== user_role.ADMIN) {
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
  },
);

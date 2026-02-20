import { auth } from "@/auth";
import { user_role } from "@prisma/client";

export type UserSession = {
  id: string;
  email: string;
  role: user_role;
};

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  return session.user;
}

/**
 * Higher-level permission checks
 */

export function isAdmin(role: user_role) {
  return role === user_role.ADMIN;
}

export function isEditor(role: user_role) {
  return role === user_role.EDITOR;
}

export function isAuthor(role: user_role) {
  return role === user_role.AUTHOR;
}

export function canManageCategories(role: user_role) {
  // Both Admins and Editors can manage categories
  return role === user_role.ADMIN || role === user_role.EDITOR;
}

export function canPublish(role: user_role) {
  // Both Admins and Editors can publish any post
  return role === user_role.ADMIN || role === user_role.EDITOR;
}

export function canManageUsers(role: user_role) {
  // ONLY Admins can manage users
  return role === user_role.ADMIN;
}

export function canEditAnyPost(role: user_role) {
  // Admins and Editors can edit any post on the platform
  return role === user_role.ADMIN || role === user_role.EDITOR;
}

export function canDeleteAnyPost(role: user_role) {
  // Let's make deletion restricted to ADMIN only to differentiate
  return role === user_role.ADMIN;
}

export function canEditPost(user: UserSession, postAuthorId: string) {
  if (canEditAnyPost(user.role)) return true;
  if (user.role === user_role.AUTHOR && postAuthorId === user.id) return true;
  return false;
}

export async function checkPermission(requiredRoles: user_role[]) {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const userRole = (session.user as any).role as user_role;

  if (!requiredRoles.includes(userRole)) {
    throw new Error("Forbidden: Insufficient Permissions");
  }

  return session.user;
}

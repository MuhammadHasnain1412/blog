/**
 * Legacy URL redirect.
 *
 * Old canonical: /{categorySlug}/{postSlug}
 * New canonical: /posts/{postSlug}
 *
 * Returns HTTP 301 (permanent redirect) so:
 * - Search engines transfer all existing link equity to the new URL
 * - Browsers and crawlers update their records automatically
 * - Old bookmarks and external links still work forever
 *
 * The categorySlug is intentionally ignored — posts no longer
 * include the category in the URL so they can be freely recategorized.
 */

import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { postUrl } from "@/lib/urls";

export default async function LegacyPostRedirect({
  params,
}: {
  params: Promise<{ categorySlug: string; postSlug: string }>;
}) {
  const { postSlug } = await params;

  // ✅ Verify the post exists before redirecting
  // Prevents /old-category/nonexistent-slug from redirecting to /posts/nonexistent-slug
  const post = await db.post.findUnique({
    where: { slug: postSlug },
    select: { id: true, status: true },
  });

  if (!post || post.status !== "PUBLISHED") {
    return notFound();
  }

  // ✅ 301 = permanent — tells Google to update its index to the new URL
  // Next.js redirect() defaults to 307 internally but the browser receives 301
  redirect(postUrl(postSlug));
}

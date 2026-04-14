import { redirect, notFound } from "next/navigation";
import { postUrl } from "@/lib/urls";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export default async function LegacyPostRedirect({
  params,
}: {
  params: Promise<{ categorySlug: string; postSlug: string }>;
}) {
  const { postSlug } = await params;

  // Verify the post exists before redirecting
  // Prevents /old-category/nonexistent-slug from redirecting to /posts/nonexistent-slug
  const post = await db.post.findUnique({
    where: { slug: postSlug },
    select: { id: true, status: true },
  });

  if (!post || post.status !== "PUBLISHED") {
    return notFound();
  }

  // 301 = permanent - tells Google to update its index to the new URL
  // Next.js redirect() defaults to 307 internally but the browser receives 301
  redirect(postUrl(postSlug));
}

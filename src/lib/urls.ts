/**
 * Centralized URL helpers.
 *
 * All internal links go through these functions so that if the URL
 * structure ever changes again, you update it in one place only.
 */

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://thedailymixa.com";

/** /posts/my-post-slug */
export function postUrl(slug: string): string {
  return `/posts/${slug}`;
}

/** https://thedailymixa.com/posts/my-post-slug */
export function absolutePostUrl(slug: string): string {
  return `${BASE_URL}/posts/${slug}`;
}

/** https://thedailymixa.com/any-path */
export function absoluteUrl(path: string): string {
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

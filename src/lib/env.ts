/**
 * Validates required environment variables at startup.
 *
 * Import this file anywhere that runs on the server — we import it in
 * layout.tsx so it runs on every cold start before any page is rendered.
 *
 * This prevents the app from silently starting with a broken config
 * and then throwing cryptic DB connection errors at runtime.
 */

/**
 * Core variables — the app CANNOT run at all without these.
 * Missing any of these throws at startup (fast-fail).
 */
const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXTAUTH_URL",
] as const;

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `\n\n❌ Missing required environment variables:\n` +
        missing.map((k) => `   - ${k}`).join("\n") +
        `\n\nThe application cannot start without these variables.\n` +
        `Check your .env file or server environment config.\n`,
    );
  }
}

// ✅ Called immediately on import — fails fast at startup, not mid-request
validateEnv();

/**
 * Feature-level guard: Image uploads require BLOB_READ_WRITE_TOKEN.
 *
 * Call this inside the upload handler (not at startup) so a missing
 * blob token only breaks image uploads, not the entire site.
 *
 * Usage in actions.ts:
 *   assertBlobConfigured();
 */
export function assertBlobConfigured(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Image uploads are not configured on this server. " +
        "Add BLOB_READ_WRITE_TOKEN to your .env file.",
    );
  }
}

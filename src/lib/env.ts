/**
 * Validates required environment variables at startup.
 *
 * Import this file anywhere that runs on the server — we import it in
 * layout.tsx so it runs on every cold start before any page is rendered.
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
 * Feature-level guard: Image uploads require AWS S3 configuration.
 *
 * Call this inside the upload handler (not at startup) so a missing
 * S3 config only breaks image uploads, not the entire site.
 */
export function assertS3Configured(): void {
  const missing = [
    "AWS_S3_BUCKET_NAME",
    "AWS_S3_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
  ].filter((k) => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(
      `Image uploads are not configured. Missing: ${missing.join(", ")}. ` +
        `Add these to your environment variables.`,
    );
  }
}

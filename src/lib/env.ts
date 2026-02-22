/**
 * Validates required environment variables at startup.
 *
 * Import this file anywhere that runs on the server — we import it in
 * layout.tsx so it runs on every cold start before any page is rendered.
 *
 * This prevents the app from silently starting with a broken config
 * and then throwing cryptic DB connection errors at runtime.
 */

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXTAUTH_URL",
  "BLOB_READ_WRITE_TOKEN", // ✅ Required since @vercel/blob image upload migration
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

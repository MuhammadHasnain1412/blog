import { google } from "googleapis";

/**
 * Service to notify Google Search Console of new or updated URLs
 * using the Google Indexing API.
 *
 * Official documentation: https://developers.google.com/search/apis/indexing-api
 */

// Load the service account key from environment variables
const SERVICE_ACCOUNT_KEY_JSON = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT;

export async function notifyGoogleOfUrl(
  url: string,
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED",
) {
  if (!SERVICE_ACCOUNT_KEY_JSON) {
    console.warn(
      "[SEO] Google Indexing API skipped: GOOGLE_INDEXING_SERVICE_ACCOUNT is not set. " +
        "See IMPLEMENTATION_SUMMARY.md for setup instructions.",
    );
    return;
  }

  try {
    const key = JSON.parse(SERVICE_ACCOUNT_KEY_JSON);

    // Create the auth client
    const auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });

    // Call the indexing API
    const indexing = google.indexing("v3");

    const response = await indexing.urlNotifications.publish({
      auth,
      requestBody: {
        url: url,
        type: type,
      },
    });

    console.log(
      `[SEO] Informed Google of ${type} for URL: ${url}`,
      response.data,
    );
    return response.data;
  } catch (error) {
    console.error("[SEO] Google Indexing API Error:", error);
    // Don't throw here to avoid breaking the user's post publishing flow
  }
}

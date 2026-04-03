import { FetchedCookies, ApiConfig } from "./types";

// ── Config storage ────────────────────────────────────────────────────────────

export async function getApiConfig(): Promise<ApiConfig> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["baseUrl", "apiKey"], (result) => {
      resolve({
        baseUrl: (result["baseUrl"] as string) || "http://localhost:3001",
        apiKey: (result["apiKey"] as string) || "SERVER_SECURE_DEV_KEY"
      });
    });
  });
}

export async function saveApiConfig(config: ApiConfig): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { baseUrl: config.baseUrl, apiKey: config.apiKey },
      resolve
    );
  });
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * PATCH /api/bots/:collection/update-session
 * Replaces the stored session cookies for the given bot collection.
 */
export async function replaceCookiesInBackend(
  fetched: FetchedCookies,
  collection: string,
  config: ApiConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${config.baseUrl}/api/bots/${encodeURIComponent(collection)}/update-session`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (config.apiKey) {
      headers["x-api-key"] = config.apiKey;
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        cookies: fetched.cookies,
        fetchedAt: fetched.fetchedAt,
        status: "active"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, message: `Server error ${response.status}: ${errText}` };
    }

    const data = (await response.json()) as { message?: string };
    return { success: true, message: data.message ?? "Updated successfully" };

  } catch (err) {
    return { success: false, message: `Network error: ${String(err)}` };
  }
}

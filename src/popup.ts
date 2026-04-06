import { detectPlatform } from "./platforms";
import { fetchPlatformCookies } from "./cookieFetcher";
import { getApiConfig, saveApiConfig, replaceCookiesInBackend } from "./apiClient";
import {
  showView,
  setAccentColor,
  renderPlatformBadge,
  renderTimestamp,
  renderCookieList,
  renderCopyPreview,
  flashCopyPreviewCopied,
  showMissingWarning,
  showStatus,
  setReplaceButtonState,
  setButtonLoading
} from "./ui";
import { FetchedCookies, PlatformConfig } from "./types";

// ── Module-level state ────────────────────────────────────────────────────────
let currentFetched: FetchedCookies | null = null;
let currentPlatform: PlatformConfig | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getActiveTabUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "GET_ACTIVE_TAB_URL" },
      (response: { url?: string } | undefined) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response?.url ?? "");
      }
    );
  });
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for environments where clipboard API is restricted
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

// ── Initialisation ────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  showView("view-loading");

  try {
    const url = await getActiveTabUrl();

    const platform = detectPlatform(url);
    if (!platform) {
      showView("view-unsupported");
      return;
    }

    currentPlatform = platform;

    // Apply platform accent colour before rendering anything
    setAccentColor(platform.color);

    // Show cookie view skeleton immediately
    showView("view-cookies");
    renderPlatformBadge(platform);

    // Fetch cookies asynchronously
    const fetched = await fetchPlatformCookies(platform);
    currentFetched = fetched;

    renderTimestamp(fetched.fetchedAt);
    renderCookieList(fetched, platform);
    showMissingWarning(fetched.missingRequired);
    updatePreview();

    // Set default passcode in UI
    const passcodeEl = document.getElementById("input-passcode") as HTMLInputElement | null;
    if (passcodeEl) passcodeEl.value = fetched.passcode;

  } catch (err) {
    console.error("[BotAuth] init error:", err);
    showView("view-unsupported");
  }
}

// ── Preview builder ───────────────────────────────────────────────────────────

function buildCopyText(fetched: FetchedCookies, platform: PlatformConfig): string {
  if (platform.copyFormat === "cookie-editor-json") {
    return buildCookieEditorJson(fetched.cookies, platform.domain);
  }
  return buildRawCookieString(fetched.cookies);
}

function updatePreview(): void {
  if (!currentFetched || !currentPlatform) return;
  const text = buildCopyText(currentFetched, currentPlatform);
  renderCopyPreview(text, currentPlatform.copyFormat);
}

// ── Copy format helpers ───────────────────────────────────────────────────────

/**
 * "raw" — what Instar, Felix, Cindy dashboards paste into their Cookie String field.
 * Output: "sessionid=xxx; ds_user_id=yyy; csrftoken=zzz"
 */
function buildRawCookieString(cookies: Record<string, string | null>): string {
  return Object.entries(cookies)
    .filter(([, v]) => v !== null && v !== "")
    .map(([k, v]) => `${k}=${v as string}`)
    .join("; ");
}

/**
 * "cookie-editor-json" — what the Xavier dashboard expects in its JSON blob field.
 * Output: [{"name":"auth_token","value":"..."},{"name":"ct0","value":"..."}]
 */
function buildCookieEditorJson(
  cookies: Record<string, string | null>,
  domain: string
): string {
  const arr = Object.entries(cookies)
    .filter(([, v]) => v !== null && v !== "")
    .map(([name, value]) => ({ name, value: value as string, domain, path: "/" }));
  return JSON.stringify(arr, null, 2);
}

// ── Button: Copy All ──────────────────────────────────────────────────────────

function setupCopyButton(): void {
  const btn = document.getElementById("btn-copy") as HTMLButtonElement | null;
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!currentFetched || !currentPlatform) return;

    const text = buildCopyText(currentFetched, currentPlatform);

    try {
      await copyToClipboard(text);
      flashCopyPreviewCopied();
      showStatus("✅ Copied to clipboard!", "success");
    } catch (err) {
      showStatus(`❌ Copy failed: ${String(err)}`, "error");
    }
  });
}

// ── Button: Replace in DB ─────────────────────────────────────────────────────

const REPLACE_DEFAULT_TEXT = "🔄 Replace in DB";

function setupReplaceButton(): void {
  const btn = document.getElementById("btn-replace") as HTMLButtonElement | null;
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!currentFetched || !currentPlatform) return;

    setReplaceButtonState(btn, "loading", REPLACE_DEFAULT_TEXT);

    try {
      const config = await getApiConfig();
      const result = await replaceCookiesInBackend(
        currentFetched,
        currentPlatform.mongoCollection,
        config
      );

      if (result.success) {
        setReplaceButtonState(btn, "success", REPLACE_DEFAULT_TEXT);
        showStatus(`✅ ${result.message}`, "success");
      } else {
        setReplaceButtonState(btn, "error", REPLACE_DEFAULT_TEXT);
        showStatus(`❌ ${result.message}`, "error");
      }
    } catch (err) {
      setReplaceButtonState(btn, "error", REPLACE_DEFAULT_TEXT);
      showStatus(`❌ Network error: ${String(err)}`, "error");
    }
  });
}

// ── Button: Refresh ───────────────────────────────────────────────────────────

function setupRefreshButton(): void {
  const btn = document.getElementById("btn-refresh") as HTMLButtonElement | null;
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!currentPlatform) return;

    btn.disabled = true;
    btn.textContent = "⏳ Refreshing...";

    try {
      const fetched = await fetchPlatformCookies(currentPlatform);
      currentFetched = fetched;

      renderTimestamp(fetched.fetchedAt);
      renderCookieList(fetched, currentPlatform);
      showMissingWarning(fetched.missingRequired);
      updatePreview();
 
      // Update UI with existing state
      const passcodeEl = document.getElementById("input-passcode") as HTMLInputElement | null;
      if (passcodeEl) passcodeEl.value = fetched.passcode;

      showStatus("✅ Cookies refreshed!", "success");
    } catch (err) {
      showStatus(`❌ Refresh failed: ${String(err)}`, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "🔃 Refresh";
    }
  });
}

// ── Passcode handling ─────────────────────────────────────────────────────────

function setupPasscodeListener(): void {
  const el = document.getElementById("input-passcode") as HTMLInputElement | null;
  if (!el) return;

  el.addEventListener("input", () => {
    if (currentFetched) {
      currentFetched.passcode = el.value.trim();
    }
  });
}

// ── Settings panel ────────────────────────────────────────────────────────────

function setupSettings(): void {
  // Open settings
  const settingsBtn = document.getElementById("settings-btn");
  settingsBtn?.addEventListener("click", async () => {
    const config = await getApiConfig();

    const baseUrlInput = document.getElementById("input-baseUrl") as HTMLInputElement | null;
    const apiKeyInput  = document.getElementById("input-apiKey")  as HTMLInputElement | null;

    if (baseUrlInput) baseUrlInput.value = config.baseUrl;
    if (apiKeyInput)  apiKeyInput.value  = config.apiKey;

    showView("view-settings");
  });

  // Save settings
  const saveBtn = document.getElementById("btn-save-settings") as HTMLButtonElement | null;
  saveBtn?.addEventListener("click", async () => {
    const baseUrl =
      (document.getElementById("input-baseUrl") as HTMLInputElement | null)?.value.trim() ?? "";
    const apiKey =
      (document.getElementById("input-apiKey")  as HTMLInputElement | null)?.value.trim() ?? "";

    await saveApiConfig({ baseUrl, apiKey });

    if (currentPlatform && currentFetched) {
      showView("view-cookies");
      showStatus("✅ Settings saved!", "success");
    } else {
      await init();
    }
  });

  // Back button
  const backBtn = document.getElementById("btn-back");
  backBtn?.addEventListener("click", () => {
    if (currentPlatform && currentFetched) {
      showView("view-cookies");
    } else {
      void init();
    }
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  setupCopyButton();
  setupReplaceButton();
  setupRefreshButton();
  setupPasscodeListener();
  setupSettings();
  void init();
});

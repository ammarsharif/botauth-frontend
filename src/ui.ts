import { PlatformConfig, FetchedCookies } from "./types";

// ── View switching ────────────────────────────────────────────────────────────

export function showView(viewId: string): void {
  document.querySelectorAll<HTMLElement>(".view").forEach((v) => {
    v.classList.add("hidden");
  });
  document.getElementById(viewId)?.classList.remove("hidden");
}

// ── Accent color ──────────────────────────────────────────────────────────────

export function setAccentColor(color: string): void {
  document.documentElement.style.setProperty("--accent", color);

  // Convert hex to RGB for the glow effects
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  document.documentElement.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
}

// ── Platform badge ────────────────────────────────────────────────────────────

export function renderPlatformBadge(platform: PlatformConfig): void {
  const badge = document.getElementById("platform-badge");
  if (!badge) return;

  badge.innerHTML = `
    <img src="${platform.iconPath}" class="pb-icon" alt="${platform.displayName}" />
    <span class="pb-name">${platform.displayName}</span>
    <span class="pb-arrow">→</span>
    <span class="pb-bot">Bot: <strong>${platform.botName}</strong></span>
  `;
}

// ── Fetch timestamp ───────────────────────────────────────────────────────────

export function renderTimestamp(fetchedAt: string): void {
  const el = document.getElementById("fetch-timestamp");
  if (!el) return;

  const d = new Date(fetchedAt);
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const dateStr = d.toLocaleDateString(undefined, {
    month: "short",
    day:   "numeric"
  });

  el.textContent = `Fetched at: ${dateStr}, ${timeStr}`;
  el.classList.remove("hidden");
}

// ── Cookie list ───────────────────────────────────────────────────────────────

export function renderCookieList(
  fetched: FetchedCookies,
  platform: PlatformConfig
): void {
  const list = document.getElementById("cookie-list");
  if (!list) return;

  list.innerHTML = "";

  for (const field of platform.cookies) {
    const rawValue = fetched.cookies[field.name] ?? null;
    const isMissing = rawValue === null;

    // Row wrapper
    const row = document.createElement("div");
    row.className = "cookie-row" + (isMissing ? " missing" : "");

    // Left side: dot + label
    const leftEl = document.createElement("div");
    leftEl.className = "cookie-left";

    // Health dot
    const dot = document.createElement("span");
    dot.className = "health-dot";
    if (!isMissing) {
      dot.textContent = "✅";
      dot.title = "Present";
    } else if (field.required) {
      dot.textContent = "❌";
      dot.title = "Required — missing!";
    } else {
      dot.textContent = "⚠️";
      dot.title = "Optional — missing";
    }

    // Label
    const nameEl = document.createElement("span");
    nameEl.className = "cookie-name";
    nameEl.textContent = field.label;

    leftEl.appendChild(dot);
    leftEl.appendChild(nameEl);

    // Right side: value + eye
    const valueWrap = document.createElement("div");
    valueWrap.className = "cookie-value-wrap";

    const valueEl = document.createElement("span");
    valueEl.className = "cookie-value";

    if (isMissing) {
      valueEl.classList.add("value-missing");
      valueEl.textContent = "Missing";

      valueWrap.appendChild(valueEl);
      row.appendChild(leftEl);
      row.appendChild(valueWrap);
      list.appendChild(row);
      continue;
    }

    // Start masked
    valueEl.dataset["raw"] = rawValue;
    valueEl.textContent = "••••••••••••";
    valueEl.classList.add("masked");

    const eyeBtn = document.createElement("button");
    eyeBtn.className = "eye-btn";
    eyeBtn.title = "Toggle visibility";
    eyeBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    `;

    eyeBtn.addEventListener("click", () => {
      const masked = valueEl.classList.contains("masked");
      if (masked) {
        valueEl.textContent = valueEl.dataset["raw"] ?? "";
        valueEl.classList.remove("masked");
        eyeBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
        `;
      } else {
        valueEl.textContent = "••••••••••••";
        valueEl.classList.add("masked");
        eyeBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        `;
      }
    });

    // Copy button for this individual cookie value
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.title = `Copy ${field.label}`;
    copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

    let copyResetTimer: ReturnType<typeof setTimeout> | null = null;
    copyBtn.addEventListener("click", () => {
      const val = rawValue;
      navigator.clipboard.writeText(val).then(() => {
        if (copyResetTimer !== null) clearTimeout(copyResetTimer);
        copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        copyBtn.classList.add("copy-btn-done");
        copyResetTimer = setTimeout(() => {
          copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
          copyBtn.classList.remove("copy-btn-done");
          copyResetTimer = null;
        }, 2000);
      }).catch(() => { /* silent fail */ });
    });

    valueWrap.appendChild(valueEl);
    valueWrap.appendChild(eyeBtn);
    valueWrap.appendChild(copyBtn);
    row.appendChild(leftEl);
    row.appendChild(valueWrap);
    list.appendChild(row);
  }
}

// ── Copy preview ─────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<string, string> = {
  "raw":               "📋 Cookie String (paste into dashboard)",
  "cookie-editor-json": "📋 Cookie-Editor JSON (paste into Xavier JSON field)"
};

let previewCopiedTimer: ReturnType<typeof setTimeout> | null = null;

export function renderCopyPreview(text: string, format: string): void {
  const wrapper = document.getElementById("copy-preview");
  const labelEl = document.getElementById("copy-preview-format");
  const textEl  = document.getElementById("copy-preview-text");
  const copiedEl = document.getElementById("copy-preview-copied");

  if (!wrapper || !labelEl || !textEl || !copiedEl) return;

  labelEl.textContent = FORMAT_LABELS[format] ?? "📋 Copy output";
  textEl.textContent  = text;
  copiedEl.classList.add("hidden");
  wrapper.classList.remove("hidden");
}

export function flashCopyPreviewCopied(): void {
  const copiedEl = document.getElementById("copy-preview-copied");
  if (!copiedEl) return;

  if (previewCopiedTimer !== null) clearTimeout(previewCopiedTimer);

  copiedEl.classList.remove("hidden");
  previewCopiedTimer = setTimeout(() => {
    copiedEl.classList.add("hidden");
    previewCopiedTimer = null;
  }, 2000);
}

// ── Missing-cookie warning ────────────────────────────────────────────────────

export function showMissingWarning(missingNames: string[]): void {
  const el = document.getElementById("missing-warning");
  if (!el) return;

  if (missingNames.length === 0) {
    el.classList.add("hidden");
    return;
  }

  el.classList.remove("hidden");
  el.innerHTML =
    `⚠️ Missing required: <strong>${missingNames.join(", ")}</strong>`;
}

// ── Status bar ────────────────────────────────────────────────────────────────

let statusTimer: ReturnType<typeof setTimeout> | null = null;

export function showStatus(
  message: string,
  type: "success" | "error"
): void {
  const el = document.getElementById("status-message");
  if (!el) return;

  if (statusTimer !== null) clearTimeout(statusTimer);

  el.textContent = message;
  el.className = `status-${type}`;
  el.classList.remove("hidden");

  statusTimer = setTimeout(() => {
    el.classList.add("hidden");
    statusTimer = null;
  }, 3000);
}

// ── Replace button state machine ──────────────────────────────────────────────

type ReplaceState = "loading" | "success" | "error" | "default";

let replaceResetTimer: ReturnType<typeof setTimeout> | null = null;

export function setReplaceButtonState(
  btn: HTMLButtonElement,
  state: ReplaceState,
  defaultText: string
): void {
  if (replaceResetTimer !== null) {
    clearTimeout(replaceResetTimer);
    replaceResetTimer = null;
  }

  // Remove previous state classes
  btn.classList.remove("btn-state-success", "btn-state-error");

  switch (state) {
    case "loading":
      btn.disabled = true;
      btn.textContent = "⏳ Updating...";
      break;

    case "success":
      btn.disabled = false;
      btn.textContent = "✅ Updated!";
      btn.classList.add("btn-state-success");
      replaceResetTimer = setTimeout(() => {
        btn.textContent = defaultText;
        btn.classList.remove("btn-state-success");
        replaceResetTimer = null;
      }, 2000);
      break;

    case "error":
      btn.disabled = false;
      btn.textContent = "❌ Failed";
      btn.classList.add("btn-state-error");
      replaceResetTimer = setTimeout(() => {
        btn.textContent = defaultText;
        btn.classList.remove("btn-state-error");
        replaceResetTimer = null;
      }, 2000);
      break;

    case "default":
      btn.disabled = false;
      btn.textContent = defaultText;
      break;
  }
}

// ── Button loading state (generic — kept for Copy button) ─────────────────────

export function setButtonLoading(
  btn: HTMLButtonElement,
  loading: boolean,
  originalText: string
): void {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span>';
  } else {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

export type PlatformName = "instagram" | "facebook" | "linkedin" | "twitter";

export interface CookieField {
  name: string;        // exact cookie name e.g. "sessionid"
  label: string;       // human-readable label
  required: boolean;   // if missing, show warning
  mongoField: string;  // field name in MongoDB document to update
}

export type CopyFormat = "raw" | "cookie-editor-json";

export interface PlatformConfig {
  name: PlatformName;
  displayName: string;     // "Instagram", "Facebook", etc.
  botName: string;         // "instar", "felix", "Cindy", "xavier"
  domain: string;          // cookie domain e.g. "www.instagram.com"
  urlMatch: string[];      // URL patterns to detect this platform
  cookies: CookieField[];
  mongoCollection: string; // e.g. "instar_config"
  color: string;           // accent color for UI
  emoji: string;
  iconPath: string;
  copyFormat: CopyFormat;  // how to format the copy-to-clipboard output
  fetchAllCookies?: boolean; // if true, fetch ALL domain cookies (e.g. LinkedIn)
}

export interface FetchedCookies {
  platform: PlatformName;
  botName: string;
  cookies: Record<string, string | null>; // cookieName → value
  fetchedAt: string;                      // ISO timestamp
  missingRequired: string[];
}

export interface ApiConfig {
  baseUrl: string; // backend REST URL
  apiKey: string;  // optional auth header
}

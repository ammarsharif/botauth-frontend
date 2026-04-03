import { PlatformConfig } from "./types";

export const PLATFORMS: PlatformConfig[] = [
  {
    name: "instagram",
    displayName: "Instagram",
    botName: "instar",
    domain: "www.instagram.com",
    urlMatch: ["instagram.com"],
    mongoCollection: "instar_config",
    color: "#E4405F",
    emoji: "📸",
    iconPath: "icons/instagram.png",
    copyFormat: "raw",
    cookies: [
      { name: "sessionid",  label: "Session ID",  required: true,  mongoField: "sessionid" },
      { name: "ds_user_id", label: "User ID",      required: true,  mongoField: "ds_user_id" },
      { name: "csrftoken",  label: "CSRF Token",   required: true,  mongoField: "csrftoken" },
      { name: "mid",        label: "Machine ID",   required: false, mongoField: "mid" }
    ]
  },
  {
    name: "facebook",
    displayName: "Facebook",
    botName: "felix",
    domain: ".facebook.com",
    urlMatch: ["facebook.com"],
    mongoCollection: "felix_config",
    color: "#1877F2",
    emoji: "📘",
    iconPath: "icons/facebook.png",
    copyFormat: "raw",
    cookies: [
      { name: "c_user", label: "User ID",          required: true,  mongoField: "c_user" },
      { name: "xs",     label: "Session Token",    required: true,  mongoField: "xs" },
      { name: "datr",   label: "Device Token",     required: false, mongoField: "datr" },
      { name: "sb",     label: "Browser ID",       required: false, mongoField: "sb" },
      { name: "fr",     label: "Ad/Session Token", required: false, mongoField: "fr" }
    ]
  },
  {
    name: "linkedin",
    displayName: "LinkedIn",
    botName: "cindy",
    domain: ".linkedin.com",
    urlMatch: ["linkedin.com"],
    mongoCollection: "cindy_config",
    color: "#0077B5",
    emoji: "💼",
    iconPath: "icons/linkedin.png",
    copyFormat: "raw",
    fetchAllCookies: true,   // Cindy dashboard wants the full Cookie: header
    cookies: [
      { name: "li_at",      label: "Auth Token",  required: true,  mongoField: "li_at" },
      { name: "JSESSIONID", label: "CSRF Token",  required: true,  mongoField: "JSESSIONID" }
    ]
  },
  {
    name: "twitter",
    displayName: "Twitter / X",
    botName: "xavier",
    domain: ".x.com",
    urlMatch: ["x.com", "twitter.com"],
    mongoCollection: "xavier_config",
    color: "#000000",
    emoji: "🐦",
    iconPath: "icons/twitter.png",
    copyFormat: "cookie-editor-json",  // Xavier dashboard wants Cookie-Editor JSON blob
    cookies: [
      { name: "auth_token", label: "Auth Token", required: true,  mongoField: "auth_token" },
      { name: "ct0",        label: "CSRF Token", required: true,  mongoField: "ct0" },
      { name: "twid",       label: "User ID",    required: false, mongoField: "twid" }
    ]
  }
];

export function detectPlatform(url: string): PlatformConfig | null {
  for (const platform of PLATFORMS) {
    if (platform.urlMatch.some(pattern => url.includes(pattern))) {
      return platform;
    }
  }
  return null;
}

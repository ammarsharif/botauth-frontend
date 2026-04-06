import { PlatformConfig, FetchedCookies } from "./types";

export async function fetchPlatformCookies(
  platform: PlatformConfig
): Promise<FetchedCookies> {
  const result: Record<string, string | null> = {};
  const missingRequired: string[] = [];

  if (platform.fetchAllCookies) {
    // Fetch every cookie for the domain (e.g. LinkedIn full Cookie: header)
    const rawDomain = platform.domain.replace(/^\./, "");
    const allCookies = await chrome.cookies.getAll({ domain: rawDomain });

    for (const c of allCookies) {
      result[c.name] = c.value;
    }

    // Validate required fields are present in the full set
    for (const field of platform.cookies) {
      if (field.required && !result[field.name]) {
        missingRequired.push(field.name);
      }
    }
  } else {
    // Fetch only the declared cookie names
    for (const cookieField of platform.cookies) {
      try {
        const primaryUrl = `https://${platform.domain.replace(/^\./, "www.")}`;
        const cookie = await chrome.cookies.get({
          url: primaryUrl,
          name: cookieField.name
        });

        if (cookie) {
          result[cookieField.name] = cookie.value;
        } else {
          const fallbackUrl = `https://${platform.domain.replace(/^\./, "")}`;
          const altCookie = await chrome.cookies.get({
            url: fallbackUrl,
            name: cookieField.name
          });
          result[cookieField.name] = altCookie ? altCookie.value : null;
        }
      } catch {
        result[cookieField.name] = null;
      }

      if (result[cookieField.name] === null && cookieField.required) {
        missingRequired.push(cookieField.name);
      }
    }
  }

  return {
    platform: platform.name,
    botName:  platform.botName,
    cookies:  result,
    fetchedAt: new Date().toISOString(),
    missingRequired,
    passcode: "1122"
  };
}

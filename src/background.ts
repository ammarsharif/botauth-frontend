// BotAuth Manager — Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log("[BotAuth] Extension installed.");
});

// Relay active-tab URL back to the popup
chrome.runtime.onMessage.addListener(
  (message: { type: string }, _sender, sendResponse) => {
    if (message.type === "GET_ACTIVE_TAB_URL") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ url: tabs[0]?.url ?? "" });
      });
      return true; // keep the message channel open for the async sendResponse
    }
    return false;
  }
);

import { HeaderRule } from "./types";
import { getRules, urlMatchesFilter } from "./shared";

const RESOURCE_TYPES: chrome.declarativeNetRequest.ResourceType[] = [
  "main_frame",
  "sub_frame",
  "xmlhttprequest",
  "script",
  "stylesheet",
  "image",
  "font",
  "object",
  "ping",
  "csp_report",
  "media",
  "websocket",
  "other",
] as chrome.declarativeNetRequest.ResourceType[];

async function rules(): Promise<void> {
  const rules = await getRules();
  const enabledRules = rules.filter((rule: HeaderRule) => rule.enabled);

  const newRules = enabledRules.map((rule: HeaderRule, idx: number) => {
    return {
      id: idx + 1,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          rule.operation === "remove"
            ? {
                header: rule.headerName,
                operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
              }
            : {
                header: rule.headerName,
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: rule.headerValue,
              },
        ],
      },
      condition: {
        urlFilter:
          rule.urlFilter && rule.urlFilter.trim() !== ""
            ? rule.urlFilter.trim()
            : "*",
        resourceTypes: RESOURCE_TYPES,
      },
    };
  });
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(
    (rule: chrome.declarativeNetRequest.Rule) => rule.id,
  );

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: newRules,
  });
}

chrome.storage.onChanged.addListener(
  (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: chrome.storage.AreaName,
  ) => {
    if (area === "local" && changes.rules) {
      void rules();
      refreshActiveTabBadges();
    }
  },
);

async function updateBadgeForUrl(
  tabId: number,
  url: string | undefined,
): Promise<void> {
  if (!url) {
    chrome.action.setBadgeText({ text: "", tabId });
    return;
  }
  const allRules = await getRules();
  const count = allRules.filter(
    (rule) => rule.enabled && urlMatchesFilter(url, rule.urlFilter),
  ).length;
  chrome.action.setBadgeText({
    text: count > 0 ? count.toString() : "",
    tabId,
  });
}

function updateBadgeForTab(tabId: number): void {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    void updateBadgeForUrl(tabId, tab.url);
  });
}

function refreshActiveTabBadges(): void {
  chrome.tabs.query({ active: true }, (tabs) => {
    for (const tab of tabs) {
      if (tab.id !== undefined) void updateBadgeForUrl(tab.id, tab.url);
    }
  });
}

chrome.tabs.onActivated.addListener((tabInfo) => {
  updateBadgeForTab(tabInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    void updateBadgeForUrl(tabId, tab.url);
  }
});

// Pick up the badge for whichever tab is already active whenever the
// service worker (re)starts, since onActivated/onUpdated won't fire for it.
refreshActiveTabBadges();

// Rebuild on install/update and browser startup
chrome.runtime.onInstalled.addListener(() => {
  void rules();
  refreshActiveTabBadges();
});
chrome.runtime.onStartup.addListener(() => {
  void rules();
  refreshActiveTabBadges();
});

import { HeaderRule } from "./types";
import { getRules } from "./shared";

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
    console.log(rule);
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
    }
  },
);

// Rebuild on install/update and browser startup
chrome.runtime.onInstalled.addListener(() => void rules());
chrome.runtime.onStartup.addListener(() => void rules());

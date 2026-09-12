import { HeaderRule } from "./types";

export async function getRules(): Promise<HeaderRule[]> {
  const { rules = [] } = (await chrome.storage.local.get("rules")) as {
    rules?: HeaderRule[];
  };
  return rules;
}

export async function saveRules(rules: HeaderRule[]): Promise<void> {
  await chrome.storage.local.set({ rules });
}

/** Approximate match of declarativeNetRequest's urlFilter wildcard syntax, for UI display purposes only. */
export function urlMatchesFilter(url: string, urlFilter: string): boolean {
  const filter = urlFilter.trim();
  if (!filter || filter === "*") return true;
  const pattern = filter
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\*/g, ".*");
  return new RegExp(`^${pattern}$`).test(url);
}

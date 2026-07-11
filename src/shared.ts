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

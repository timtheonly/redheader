// src/popup.ts
import { HeaderRule } from "./types";
import {
  getRules,
  saveRules,
  getPausedIds,
  savePauseIds,
  initRuleManager,
} from "./shared";

const pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
const viewAllBtn = document.getElementById("viewAllBtn") as HTMLButtonElement;

async function updatePauseButtonLabel(): Promise<void> {
  const pausedRuleIds = await getPausedIds();
  pauseBtn.innerText =
    pausedRuleIds.length > 0 ? "Resume paused rules" : "Pause all rules";
}

pauseBtn.addEventListener("click", async () => {
  const rules = await getRules();
  let pausedRuleIds = await getPausedIds();
  const isPaused = pausedRuleIds.length > 0;
  const updatedRules: HeaderRule[] = rules.map((rule) => {
    if (isPaused) {
      if (pausedRuleIds.includes(rule.id)) {
        rule.enabled = true;
        pausedRuleIds = pausedRuleIds.filter((id) => id !== rule.id);
      }
    } else if (rule.enabled) {
      rule.enabled = false;
      pausedRuleIds.push(rule.id);
    }
    return rule;
  });
  await savePauseIds(pausedRuleIds);
  await saveRules(updatedRules);
});

viewAllBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
});

initRuleManager(5, () => void updatePauseButtonLabel());
void updatePauseButtonLabel();

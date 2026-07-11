// src/popup.ts
import { HeaderRule, HeaderOperation } from "./types";

const form = document.getElementById("rule-form") as HTMLFormElement;
const urlFilterInput = document.getElementById("urlFilter") as HTMLInputElement;
const operationSelect = document.getElementById(
  "operation",
) as HTMLSelectElement;
const headerNameInput = document.getElementById(
  "headerName",
) as HTMLInputElement;
const headerValueInput = document.getElementById(
  "headerValue",
) as HTMLInputElement;
const headerValueLabel = document.getElementById(
  "headerValueLabel",
) as HTMLLabelElement;
const ruleList = document.getElementById("rule-list") as HTMLUListElement;

operationSelect.addEventListener("change", () => {
  const isRemove = operationSelect.value === "remove";
  headerValueLabel.style.display = isRemove ? "none" : "block";
  headerValueInput.required = !isRemove;
});

async function getRules(): Promise<HeaderRule[]> {
  const { rules = [] } = (await chrome.storage.local.get("rules")) as {
    rules?: HeaderRule[];
  };
  return rules;
}

async function saveRules(rules: HeaderRule[]): Promise<void> {
  await chrome.storage.local.set({ rules });
}

function renderRules(rules: HeaderRule[]): void {
  ruleList.innerHTML = "";
  if (rules.length === 0) {
    ruleList.innerHTML =
      '<li style="justify-content:center;color:#999;">No rules yet</li>';
    return;
  }

  rules.forEach((rule) => {
    const li = document.createElement("li");

    const info = document.createElement("span");
    info.className = "rule-info";
    const summary =
      rule.operation === "remove"
        ? `Remove "${rule.headerName}" on ${rule.urlFilter || "*"}`
        : `Set "${rule.headerName}" = "${rule.headerValue}" on ${rule.urlFilter || "*"}`;
    info.textContent = summary;
    info.title = summary;
    info.style.opacity = rule.enabled ? "1" : "0.4";

    const actions = document.createElement("span");
    actions.className = "rule-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-btn";
    toggleBtn.textContent = rule.enabled ? "On" : "Off";
    toggleBtn.addEventListener("click", async () => {
      const current = await getRules();
      const target = current.find((r) => r.id === rule.id);
      if (!target) return;
      target.enabled = !target.enabled;
      await saveRules(current);
      renderRules(current);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      const current = await getRules();
      const updated = current.filter((r) => r.id !== rule.id);
      await saveRules(updated);
      renderRules(updated);
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(info);
    li.appendChild(actions);
    ruleList.appendChild(li);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const rules = await getRules();
  const operation = operationSelect.value as HeaderOperation;

  const newRule: HeaderRule = {
    id: Date.now(),
    enabled: true,
    urlFilter: urlFilterInput.value.trim(),
    operation,
    headerName: headerNameInput.value.trim(),
    headerValue: operation === "remove" ? "" : headerValueInput.value,
  };

  if (!newRule.headerName) return;

  rules.push(newRule);
  await saveRules(rules);
  renderRules(rules);
  form.reset();
  headerValueLabel.style.display = "block";
});

(async function init(): Promise<void> {
  const rules = await getRules();
  renderRules(rules);
})();

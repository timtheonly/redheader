// src/popup.ts
import { HeaderRule, HeaderOperation } from "./types";
import { getRules, saveRules } from "./shared";

const form = document.getElementById("rule-form") as HTMLFormElement;
const urlFilterInput = document.getElementById("urlFilter") as HTMLInputElement;
const operationSelect = document.getElementById(
  "operation",
) as HTMLSelectElement;
const headerNameInput = document.getElementById(
  "headerName",
) as HTMLInputElement;
const headerIdInput = document.getElementById("headerId") as HTMLInputElement;
const headerValueInput = document.getElementById(
  "headerValue",
) as HTMLInputElement;
const headerValueLabel = document.getElementById(
  "headerValueLabel",
) as HTMLLabelElement;
const ruleList = document.getElementById("rule-list") as HTMLUListElement;
const submitBtn = document.getElementById("submitbtn") as HTMLButtonElement;
const cancelBtn = document.getElementById("cancelBtn") as HTMLButtonElement;

operationSelect.addEventListener("change", () => {
  const isRemove = operationSelect.value === "remove";
  headerValueLabel.style.display = isRemove ? "none" : "block";
  headerValueInput.required = !isRemove;
});


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

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", async () => {
      headerNameInput.value = rule.headerName;
      headerValueInput.value = rule.headerValue;
      urlFilterInput.value = rule.urlFilter;
      operationSelect.value = rule.operation;
      operationSelect.dispatchEvent(new Event("change"));
      headerIdInput.value = rule.id.toString();
      submitBtn.innerText = "Save";
      cancelBtn.hidden = false;
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(info);
    li.appendChild(actions);
    ruleList.appendChild(li);
  });
}

async function resetForm(e: Event) {
  e.preventDefault();
  form.reset();
  headerIdInput.value = "";
  submitBtn.innerText = "Add rule";
  cancelBtn.hidden = true;
  headerValueLabel.style.display = "block";
}

cancelBtn.addEventListener("click", resetForm);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let rules = await getRules();
  const operation = operationSelect.value as HeaderOperation;

  const isEditing = headerIdInput.value !== "";
  const editedRule = isEditing
    ? rules.find((r) => r.id === Number(headerIdInput.value))
    : undefined;

  const newRule: HeaderRule = {
    id: isEditing ? Number(headerIdInput.value) : Date.now(),
    enabled: editedRule?.enabled ?? true,
    urlFilter: urlFilterInput.value.trim(),
    operation,
    headerName: headerNameInput.value.trim(),
    headerValue: operation === "remove" ? "" : headerValueInput.value,
  };

  if (!newRule.headerName) return;
  rules = rules.filter((r) => r.id !== newRule.id);
  rules.push(newRule);
  await saveRules(rules);
  renderRules(rules);
  resetForm(e);
});

(async function init(): Promise<void> {
  const rules = await getRules();
  renderRules(rules);
})();

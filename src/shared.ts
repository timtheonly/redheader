import { HeaderRule, HeaderOperation } from "./types";

export async function getRules(): Promise<HeaderRule[]> {
  const { rules = [] } = (await chrome.storage.local.get("rules")) as {
    rules?: HeaderRule[];
  };
  return rules;
}

export async function getPausedIds(): Promise<number[]> {
  const { pausedIds = [] } = (await chrome.storage.local.get("pausedIds")) as { pausedIds?: number[] }
  return pausedIds;
}

export async function savePauseIds(pausedIds: number[]): Promise<void> {
  await chrome.storage.local.set({ pausedIds });
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

interface RuleListElements {
  form: HTMLFormElement;
  urlFilterInput: HTMLInputElement;
  operationSelect: HTMLSelectElement;
  headerNameInput: HTMLInputElement;
  headerIdInput: HTMLInputElement;
  headerValueInput: HTMLInputElement;
  headerValueLabel: HTMLLabelElement;
  submitBtn: HTMLButtonElement;
  cancelBtn: HTMLButtonElement;
  ruleList: HTMLUListElement;
}

interface PaginationElements {
  container: HTMLElement;
  prevBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  indicator: HTMLElement;
}

// popup.html and options.html must keep these element IDs in sync.
function queryRuleListElements(): RuleListElements {
  const byId = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  return {
    form: byId("rule-form"),
    urlFilterInput: byId("urlFilter"),
    operationSelect: byId("operation"),
    headerNameInput: byId("headerName"),
    headerIdInput: byId("headerId"),
    headerValueInput: byId("headerValue"),
    headerValueLabel: byId("headerValueLabel"),
    submitBtn: byId("submitbtn"),
    cancelBtn: byId("cancelBtn"),
    ruleList: byId("rule-list"),
  };
}

function queryPaginationElements(): PaginationElements {
  const byId = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  return {
    container: byId("pagination"),
    prevBtn: byId("prevPageBtn"),
    nextBtn: byId("nextPageBtn"),
    indicator: byId("pageIndicator"),
  };
}

function resetForm(elements: RuleListElements): void {
  elements.form.reset();
  // form.reset() can't clear hidden inputs: their value *is* their default.
  elements.headerIdInput.value = "";
  elements.submitBtn.innerText = "Add rule";
  elements.cancelBtn.hidden = true;
  elements.headerValueLabel.style.display = "block";
}

function populateFormForEdit(elements: RuleListElements, rule: HeaderRule): void {
  elements.headerNameInput.value = rule.headerName;
  elements.headerValueInput.value = rule.headerValue;
  elements.urlFilterInput.value = rule.urlFilter;
  elements.operationSelect.value = rule.operation;
  elements.operationSelect.dispatchEvent(new Event("change"));
  elements.headerIdInput.value = rule.id.toString();
  elements.submitBtn.innerText = "Save";
  elements.cancelBtn.hidden = false;
  elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setupRuleForm(elements: RuleListElements): void {
  const {
    form,
    urlFilterInput,
    operationSelect,
    headerNameInput,
    headerIdInput,
    headerValueInput,
    headerValueLabel,
    cancelBtn,
  } = elements;

  operationSelect.addEventListener("change", () => {
    const isRemove = operationSelect.value === "remove";
    headerValueLabel.style.display = isRemove ? "none" : "block";
    headerValueInput.required = !isRemove;
  });

  cancelBtn.addEventListener("click", () => resetForm(elements));

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
    resetForm(elements);
  });
}

class Paginator {
  currentPage = 0;

  constructor(
    private readonly pageSize: number,
    private readonly elements: PaginationElements,
    onPageChange: () => void,
  ) {
    elements.prevBtn.addEventListener("click", () => {
      this.currentPage = Math.max(0, this.currentPage - 1);
      onPageChange();
    });
    elements.nextBtn.addEventListener("click", () => {
      this.currentPage += 1;
      onPageChange();
    });
  }

  paginate<T>(items: T[]): T[] {
    const totalPages = Math.max(1, Math.ceil(items.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, totalPages - 1);
    const start = this.currentPage * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  update(totalItems: number): void {
    const totalPages = Math.ceil(totalItems / this.pageSize);
    if (totalPages <= 1) {
      this.hide();
      return;
    }
    this.elements.container.hidden = false;
    this.elements.indicator.textContent = `Page ${this.currentPage + 1} of ${totalPages}`;
    this.elements.prevBtn.disabled = this.currentPage === 0;
    this.elements.nextBtn.disabled = this.currentPage >= totalPages - 1;
  }

  hide(): void {
    this.elements.container.hidden = true;
  }
}

function createRuleRow(
  rule: HeaderRule,
  pausedRuleIds: number[],
  elements: RuleListElements,
): HTMLLIElement {
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
  toggleBtn.textContent =
    pausedRuleIds.includes(rule.id) || !rule.enabled ? "Off" : "On";
  toggleBtn.addEventListener("click", async () => {
    const current = await getRules();
    const target = current.find((r) => r.id === rule.id);
    if (!target) return;
    target.enabled = !target.enabled;
    if (target.enabled) {
      const pausedIds = await getPausedIds();
      if (pausedIds.includes(rule.id)) {
        await savePauseIds(pausedIds.filter((id) => id !== rule.id));
      }
    }
    await saveRules(current);
  });

  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => populateFormForEdit(elements, rule));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", async () => {
    const current = await getRules();
    const pausedIds = await getPausedIds();
    if (pausedIds.includes(rule.id)) {
      await savePauseIds(pausedIds.filter((id) => id !== rule.id));
    }
    await saveRules(current.filter((r) => r.id !== rule.id));
  });

  actions.append(toggleBtn, editBtn, deleteBtn);
  li.append(info, actions);
  return li;
}

async function renderRuleList(
  rules: HeaderRule[],
  elements: RuleListElements,
  paginator: Paginator,
): Promise<void> {
  const { ruleList } = elements;
  ruleList.innerHTML = "";
  if (rules.length === 0) {
    ruleList.innerHTML =
      '<li style="justify-content:center;color:#999;">No rules yet</li>';
    paginator.hide();
    return;
  }

  const pausedRuleIds = await getPausedIds();
  for (const rule of paginator.paginate(rules)) {
    ruleList.appendChild(createRuleRow(rule, pausedRuleIds, elements));
  }
  paginator.update(rules.length);
}

/**
 * Wires the add/edit form and paginated rule list, and re-renders whenever
 * rules or pause state change in storage (from this page or any other).
 */
export function initRuleManager(
  pageSize: number,
  onRulesChanged?: () => void,
): void {
  const elements = queryRuleListElements();
  const render = (rules: HeaderRule[]) =>
    renderRuleList(rules, elements, paginator);
  const refresh = () => void getRules().then(render);
  const paginator = new Paginator(pageSize, queryPaginationElements(), refresh);

  setupRuleForm(elements);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.rules || changes.pausedIds)) {
      onRulesChanged?.();
      refresh();
    }
  });

  refresh();
}

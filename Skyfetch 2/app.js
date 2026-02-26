// --- Utilities ---
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

// --- State ---
const STORAGE_KEY = "todo_app_v1";
let todos = loadTodos();
let filter = "all";

// --- Elements ---
const form = $("#todoForm");
const input = $("#todoInput");
const listEl = $("#list");

const statTotal = $("#statTotal");
const statActive = $("#statActive");
const statDone = $("#statDone");

const chips = $$(".chip");
const btnClearDone = $("#btnClearDone");
const btnClearAll = $("#btnClearAll");

// --- Load/Save ---
function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// --- CRUD ---
function addTodo(text) {
  const now = new Date();
  const item = {
    id: uid(),
    text,
    done: false,
    createdAt: now.toISOString()
  };
  todos.unshift(item);
  saveTodos();
  render();
}

function toggleTodo(id) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter(x => x.id !== id);
  saveTodos();
  render();
}

function clearDone() {
  todos = todos.filter(x => !x.done);
  saveTodos();
  render();
}

function clearAll() {
  todos = [];
  saveTodos();
  render();
}

function updateTodoText(id, newText) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.text = newText;
  saveTodos();
  render();
}

// --- Filtering ---
function setFilter(next) {
  filter = next;
  chips.forEach(c => c.setAttribute("aria-pressed", String(c.dataset.filter === filter)));
  render();
}

function getVisibleTodos() {
  if (filter === "active") return todos.filter(t => !t.done);
  if (filter === "done") return todos.filter(t => t.done);
  return todos;
}

// --- Rendering ---
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderStats() {
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  const active = total - done;
  statTotal.textContent = total;
  statActive.textContent = active;
  statDone.textContent = done;
}

function render() {
  renderStats();
  const visible = getVisibleTodos();

  listEl.innerHTML = "";
  if (visible.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent =
      filter === "all"
        ? "No tasks yet. Add one above!"
        : `No "${filter}" tasks right now.`;
    listEl.appendChild(empty);
    return;
  }

  for (const t of visible) {
    const row = document.createElement("div");
    row.className = "item" + (t.done ? " done" : "");
    row.dataset.id = t.id;

    // checkbox
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = t.done;
    cb.setAttribute("aria-label", "Mark done");
    cb.addEventListener("change", () => toggleTodo(t.id));

    // text
    const textWrap = document.createElement("div");
    textWrap.className = "text";

    const task = document.createElement("div");
    task.className = "task";
    task.textContent = t.text;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = "Created: " + formatDate(t.createdAt);

    textWrap.appendChild(task);
    textWrap.appendChild(meta);

    // actions
    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";

    const btnDel = document.createElement("button");
    btnDel.className = "icon-btn danger";
    btnDel.type = "button";
    btnDel.textContent = "Delete";
    btnDel.addEventListener("click", () => deleteTodo(t.id));

    actions.appendChild(btnDel);

    // double click to edit
    task.addEventListener("dblclick", () => startInlineEdit(t.id, task, t.text));

    row.appendChild(cb);
    row.appendChild(textWrap);
    row.appendChild(actions);

    listEl.appendChild(row);
  }
}

function startInlineEdit(id, taskEl, currentText) {
  const edit = document.createElement("input");
  edit.type = "text";
  edit.value = currentText;
  edit.maxLength = 120;
  edit.style.width = "100%";
  edit.style.padding = "10px 12px";
  edit.style.borderRadius = "12px";
  edit.style.border = "1px solid rgba(148,163,184,.25)";
  edit.style.background = "rgba(0,0,0,.18)";
  edit.style.color = "inherit";
  edit.style.outline = "none";

  const parent = taskEl.parentElement;
  parent.replaceChild(edit, taskEl);
  edit.focus();
  edit.setSelectionRange(currentText.length, currentText.length);

  const commit = () => {
    const next = edit.value.trim();
    if (next && next !== currentText) updateTodoText(id, next);
    else render(); // revert
  };

  edit.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") render();
  });
  edit.addEventListener("blur", commit);
}

// --- Events ---
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

chips.forEach(chip => chip.addEventListener("click", () => setFilter(chip.dataset.filter)));

btnClearDone.addEventListener("click", clearDone);
btnClearAll.addEventListener("click", clearAll);

// Initial render
render();
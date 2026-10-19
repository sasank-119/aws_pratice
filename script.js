(() => {
  "use strict";

  const TASKS_KEY = "launchpad-practice-tasks-v1";
  const CHECKS_KEY = "launchpad-deployment-checks-v1";
  const THEME_KEY = "launchpad-theme-v1";

  const taskForm = document.getElementById("taskForm");
  const taskInput = document.getElementById("taskInput");
  const taskList = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");
  const toast = document.getElementById("toast");
  const filterButtons = [...document.querySelectorAll(".filter-btn")];
  const checkboxes = [...document.querySelectorAll("[data-check]")];

  let activeFilter = "all";
  let tasks = loadJson(TASKS_KEY, [
    { id: makeId(), text: "Connect to my EC2 instance using SSH", completed: false },
    { id: makeId(), text: "Install Nginx and verify its status", completed: false },
    { id: makeId(), text: "Deploy a static webpage", completed: true }
  ]);
  let toastTimer;

  function makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      showToast("Browser storage is unavailable; changes may not persist.");
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function renderTasks() {
    taskList.innerHTML = "";
    const visibleTasks = tasks.filter(task => {
      if (activeFilter === "active") return !task.completed;
      if (activeFilter === "completed") return task.completed;
      return true;
    });

    visibleTasks.forEach(task => {
      const item = document.createElement("li");
      item.className = `task-item${task.completed ? " done" : ""}`;
      item.innerHTML = `
        <input class="task-check" type="checkbox" aria-label="Mark task complete" ${task.completed ? "checked" : ""}>
        <span class="task-name">${escapeText(task.text)}</span>
        <button class="delete-task" type="button" aria-label="Delete task" title="Delete task">×</button>
      `;
      item.querySelector(".task-check").addEventListener("change", event => {
        task.completed = event.target.checked;
        saveTasks();
        renderAll();
        showToast(task.completed ? "Task completed!" : "Task marked active.");
      });
      item.querySelector(".delete-task").addEventListener("click", () => {
        tasks = tasks.filter(entry => entry.id !== task.id);
        saveTasks();
        renderAll();
        showToast("Task deleted.");
      });
      taskList.appendChild(item);
    });

    emptyState.classList.toggle("show", visibleTasks.length === 0);
    document.getElementById("taskCount").textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
    document.getElementById("taskFooterText").textContent = `${tasks.length} saved in this browser`;
  }

  function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const remaining = total - completed;
    const percent = total ? Math.round(completed / total * 100) : 0;

    document.getElementById("totalStat").textContent = total;
    document.getElementById("completedStat").textContent = completed;
    document.getElementById("remainingStat").textContent = remaining;
    document.getElementById("progressStat").textContent = `${percent}%`;
    document.getElementById("mainProgress").style.width = `${percent}%`;
    document.getElementById("progressCaption").textContent = total === 0 ? "Add your first task" : percent === 100 ? "All tasks completed!" : `${remaining} task${remaining === 1 ? "" : "s"} to go`;
    document.getElementById("sidebarProgress").style.width = `${percent}%`;
    document.getElementById("sidebarProgressText").textContent = `${percent}% complete`;
  }

  function renderChecklist() {
    const completed = checkboxes.filter(box => box.checked).length;
    document.getElementById("checklistCount").textContent = `${completed} / ${checkboxes.length}`;
    document.getElementById("checklistMessage").textContent = completed === checkboxes.length
      ? "Great work — checklist completed!"
      : "Tick each step as you complete it.";
  }

  function renderAll() {
    renderTasks();
    renderStats();
    renderChecklist();
  }

  taskForm.addEventListener("submit", event => {
    event.preventDefault();
    const text = taskInput.value.trim();
    if (!text) {
      showToast("Enter a task before adding it.");
      taskInput.focus();
      return;
    }
    tasks.unshift({ id: makeId(), text, completed: false });
    saveTasks();
    taskInput.value = "";
    activeFilter = "all";
    filterButtons.forEach(button => button.classList.toggle("active", button.dataset.filter === activeFilter));
    renderAll();
    showToast("Task added.");
    taskInput.focus();
  });

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      filterButtons.forEach(item => item.classList.toggle("active", item === button));
      renderTasks();
    });
  });

  document.getElementById("clearCompleted").addEventListener("click", () => {
    const before = tasks.length;
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderAll();
    showToast(before === tasks.length ? "There are no completed tasks to clear." : "Completed tasks cleared.");
  });

  checkboxes.forEach(box => {
    box.checked = false;
    box.addEventListener("change", () => {
      const values = checkboxes.map(item => item.checked);
      try { localStorage.setItem(CHECKS_KEY, JSON.stringify(values)); } catch (_) {}
      renderChecklist();
    });
  });

  document.getElementById("resetChecklist").addEventListener("click", () => {
    checkboxes.forEach(box => { box.checked = false; });
    try { localStorage.setItem(CHECKS_KEY, JSON.stringify(checkboxes.map(() => false))); } catch (_) {}
    renderChecklist();
    showToast("Deployment checklist reset.");
  });

  const savedChecks = loadJson(CHECKS_KEY, []);
  if (Array.isArray(savedChecks)) {
    checkboxes.forEach((box, index) => { box.checked = Boolean(savedChecks[index]); });
  }

  const themeToggle = document.getElementById("themeToggle");
  function applyTheme(theme) {
    document.body.classList.toggle("light-mode", theme === "dark");
    themeToggle.innerHTML = theme === "dark" ? "☾ <span>Dark</span>" : "☼ <span>Light</span>";
  }
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
  themeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("light-mode") ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    applyTheme(next);
  });

  renderAll();
})();

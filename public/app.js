const appConfig = window.APP_CONFIG || {};
const firebaseConfig = appConfig.firebase || {};
const apiBaseUrl = appConfig.apiBaseUrl || "";

const state = {
  idToken: null,
  user: null,
  tasks: [],
  columns: [],
  shifts: [],
  gantt: null,
  statusChart: null,
  lastReportImageBase64: null
};

const elements = {
  authMode: document.getElementById("auth-mode"),
  authStatus: document.getElementById("auth-status"),
  authForm: document.getElementById("auth-form"),
  authEmail: document.getElementById("auth-email"),
  authPassword: document.getElementById("auth-password"),
  loginBtn: document.getElementById("login-btn"),
  registerBtn: document.getElementById("register-btn"),
  logoutBtn: document.getElementById("logout-btn"),
  taskForm: document.getElementById("task-form"),
  taskTitle: document.getElementById("task-title"),
  taskDescription: document.getElementById("task-description"),
  taskResponsible: document.getElementById("task-responsible"),
  taskPriority: document.getElementById("task-priority"),
  taskStatus: document.getElementById("task-status"),
  taskStartDate: document.getElementById("task-start-date"),
  taskDueDate: document.getElementById("task-due-date"),
  taskShift: document.getElementById("task-shift"),
  reloadBoardBtn: document.getElementById("reload-board-btn"),
  board: document.getElementById("kanban-board"),
  reloadGanttBtn: document.getElementById("reload-gantt-btn"),
  gantt: document.getElementById("gantt"),
  dailyDate: document.getElementById("daily-date"),
  loadDailyBtn: document.getElementById("load-daily-btn"),
  downloadPngBtn: document.getElementById("download-png-btn"),
  downloadPdfBtn: document.getElementById("download-pdf-btn"),
  dailyReport: document.getElementById("daily-report"),
  statusChart: document.getElementById("status-chart"),
  emailForm: document.getElementById("email-form"),
  emailTo: document.getElementById("email-to"),
  emailSubject: document.getElementById("email-subject"),
  emailMessage: document.getElementById("email-message"),
  emailStatus: document.getElementById("email-status"),
  toast: document.getElementById("toast")
};

const statusLabel = {
  backlog: "Backlog",
  todo: "A Fazer",
  doing: "Em Andamento",
  done: "Concluido"
};

const defaultColumns = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "A Fazer" },
  { id: "doing", title: "Em Andamento" },
  { id: "done", title: "Concluido" }
];

boot();

function boot() {
  elements.dailyDate.value = todayIso();
  setupListeners();
  setupFirebaseAuth();
  refreshAll();
}

function setupListeners() {
  elements.authForm.addEventListener("submit", handleLogin);
  elements.registerBtn.addEventListener("click", handleRegister);
  elements.logoutBtn.addEventListener("click", handleLogout);
  elements.taskForm.addEventListener("submit", handleCreateTask);
  elements.reloadBoardBtn.addEventListener("click", loadTasks);
  elements.reloadGanttBtn.addEventListener("click", loadGantt);
  elements.loadDailyBtn.addEventListener("click", (event) => {
    event.preventDefault();
    loadDailyReport();
  });
  elements.downloadPngBtn.addEventListener("click", (event) => {
    event.preventDefault();
    downloadDailyPng();
  });
  elements.downloadPdfBtn.addEventListener("click", (event) => {
    event.preventDefault();
    downloadDailyPdf();
  });
  elements.emailForm.addEventListener("submit", handleSendEmail);
}

function setupFirebaseAuth() {
  const hasFirebaseConfig = Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
  );

  if (!hasFirebaseConfig) {
    elements.authMode.textContent = "Modo local (Firebase Web nao configurado)";
    elements.authStatus.textContent = "Acesso local habilitado para desenvolvimento.";
    elements.loginBtn.disabled = true;
    elements.registerBtn.disabled = true;
    elements.logoutBtn.disabled = true;
    return;
  }

  firebase.initializeApp(firebaseConfig);
  elements.authMode.textContent = "Firebase ativo";
  firebase.auth().onAuthStateChanged(async (user) => {
    state.user = user;
    if (user) {
      state.idToken = await user.getIdToken();
      elements.authStatus.textContent = `Logado como ${user.email}`;
      elements.logoutBtn.disabled = false;
    } else {
      state.idToken = null;
      elements.authStatus.textContent = "Nao autenticado";
      elements.logoutBtn.disabled = true;
    }
    await refreshAll();
  });
}

async function handleLogin(event) {
  event.preventDefault();
  if (!firebase.apps.length) {
    notify("Firebase nao configurado neste ambiente.");
    return;
  }

  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;
  if (!email || !password) {
    notify("Informe e-mail e senha.");
    return;
  }

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    notify("Login realizado.");
  } catch (error) {
    notify(`Falha no login: ${error.message}`);
  }
}

async function handleRegister() {
  if (!firebase.apps.length) {
    notify("Firebase nao configurado neste ambiente.");
    return;
  }

  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;
  if (!email || !password) {
    notify("Informe e-mail e senha para registrar.");
    return;
  }

  try {
    await firebase.auth().createUserWithEmailAndPassword(email, password);
    notify("Usuario registrado com sucesso.");
  } catch (error) {
    notify(`Falha no cadastro: ${error.message}`);
  }
}

async function handleLogout() {
  if (!firebase.apps.length) {
    state.user = null;
    state.idToken = null;
    elements.authStatus.textContent = "Logout local concluido.";
    return;
  }
  await firebase.auth().signOut();
  notify("Sessao finalizada.");
}

async function refreshAll() {
  await Promise.all([loadTasks(), loadShifts(), loadGantt(), loadDailyReport()]);
}

async function loadTasks() {
  try {
    const data = await apiFetch("/api/tasks");
    state.tasks = data.tasks || [];
    state.columns = data.columns?.length ? data.columns : defaultColumns;
    renderBoard();
  } catch (error) {
    notify(`Erro ao carregar tarefas: ${error.message}`);
  }
}

function renderBoard() {
  elements.board.innerHTML = "";
  for (const column of state.columns) {
    const columnEl = document.createElement("section");
    columnEl.className = "kanban-column";
    columnEl.dataset.columnId = column.id;
    columnEl.innerHTML = `<h3>${escapeHtml(column.title)}</h3>`;

    wireColumnDrop(columnEl);
    const tasks = state.tasks.filter((task) => task.status === column.id);
    for (const task of tasks) {
      columnEl.append(createTaskCard(task));
    }
    elements.board.append(columnEl);
  }
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = `task-card priority-${task.priority || "media"}`;
  card.draggable = true;
  card.dataset.taskId = task.id;
  card.innerHTML = `
    <h4>${escapeHtml(task.title)}</h4>
    <p class="task-meta">${escapeHtml(task.description || "Sem descricao")}</p>
    <p class="task-meta"><strong>Resp:</strong> ${escapeHtml(task.responsible || "Sem responsavel")}</p>
    <p class="task-meta"><strong>Escala:</strong> ${escapeHtml(task.shiftId || "Sem escala")}</p>
    <p class="task-meta"><strong>Inicio:</strong> ${escapeHtml(task.startDate || "-")} | <strong>Fim:</strong> ${escapeHtml(task.dueDate || "-")}</p>
    <div class="task-actions">
      <button data-delete="${task.id}">Excluir</button>
    </div>
  `;

  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", task.id);
    event.dataTransfer.effectAllowed = "move";
  });

  card.querySelector(`[data-delete="${task.id}"]`).addEventListener("click", () => deleteTask(task.id));
  return card;
}

function wireColumnDrop(columnEl) {
  columnEl.addEventListener("dragover", (event) => {
    event.preventDefault();
    columnEl.classList.add("drag-over");
  });

  columnEl.addEventListener("dragleave", () => {
    columnEl.classList.remove("drag-over");
  });

  columnEl.addEventListener("drop", async (event) => {
    event.preventDefault();
    columnEl.classList.remove("drag-over");
    const taskId = event.dataTransfer.getData("text/plain");
    if (!taskId) {
      return;
    }
    await updateTask(taskId, { status: columnEl.dataset.columnId });
  });
}

async function handleCreateTask(event) {
  event.preventDefault();
  const payload = {
    title: elements.taskTitle.value.trim(),
    description: elements.taskDescription.value.trim(),
    responsible: elements.taskResponsible.value.trim(),
    priority: elements.taskPriority.value,
    status: elements.taskStatus.value,
    startDate: elements.taskStartDate.value,
    dueDate: elements.taskDueDate.value,
    shiftId: elements.taskShift.value
  };

  if (!payload.title) {
    notify("Titulo da tarefa e obrigatorio.");
    return;
  }

  try {
    await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    elements.taskForm.reset();
    await refreshAll();
    notify("Tarefa criada.");
  } catch (error) {
    notify(`Erro ao criar tarefa: ${error.message}`);
  }
}

async function updateTask(taskId, patch) {
  try {
    await apiFetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });
    await refreshAll();
  } catch (error) {
    notify(`Erro ao mover tarefa: ${error.message}`);
  }
}

async function deleteTask(taskId) {
  try {
    await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    await refreshAll();
    notify("Tarefa removida.");
  } catch (error) {
    notify(`Erro ao excluir tarefa: ${error.message}`);
  }
}

async function loadShifts() {
  try {
    const data = await apiFetch("/api/scale/shifts");
    state.shifts = data.shifts || [];
    renderShifts();
  } catch (error) {
    notify(`Erro ao buscar escalas: ${error.message}`);
  }
}

function renderShifts() {
  const previous = elements.taskShift.value;
  elements.taskShift.innerHTML = '<option value="">Escala (opcional)</option>';
  for (const shift of state.shifts) {
    const option = document.createElement("option");
    option.value = shift.id;
    option.textContent = shift.label || shift.name || shift.id;
    if (shift.id === previous) {
      option.selected = true;
    }
    elements.taskShift.append(option);
  }
}

async function loadGantt() {
  try {
    const data = await apiFetch("/api/gantt");
    renderGantt(data.tasks || []);
  } catch (error) {
    notify(`Erro ao carregar Gantt: ${error.message}`);
  }
}

function renderGantt(tasks) {
  elements.gantt.innerHTML = "";
  if (!tasks.length) {
    elements.gantt.innerHTML = "<p>Nenhuma tarefa com inicio e fim para o grafico Gantt.</p>";
    return;
  }

  state.gantt = new Gantt("#gantt", tasks, {
    language: "pt",
    view_mode: "Week",
    popup_trigger: "click"
  });
}

async function loadDailyReport() {
  const date = elements.dailyDate.value || todayIso();
  try {
    const report = await apiFetch(`/api/reports/daily?date=${encodeURIComponent(date)}`);
    state.lastReportImageBase64 = null;
    renderDailyReport(report);
  } catch (error) {
    notify(`Erro ao carregar relatorio diario: ${error.message}`);
  }
}

function renderDailyReport(report) {
  const dueTasks = (report.dueToday || [])
    .map(
      (task) =>
        `<li>${escapeHtml(task.title)} - ${escapeHtml(task.responsible || "Sem responsavel")} (${escapeHtml(statusLabel[task.status] || task.status)})</li>`
    )
    .join("");

  elements.dailyReport.innerHTML = `
    <h3>Relatorio de ${escapeHtml(report.date)}</h3>
    <div class="daily-grid">
      <div class="metric"><span>Total de tarefas</span><strong>${report.totalTasks}</strong></div>
      <div class="metric"><span>Criadas no dia</span><strong>${report.createdTodayCount}</strong></div>
      <div class="metric"><span>Concluidas no dia</span><strong>${report.doneTodayCount}</strong></div>
      <div class="metric"><span>Vencem hoje</span><strong>${report.dueTodayCount}</strong></div>
    </div>
    <h4>Tarefas vencendo no dia</h4>
    <ul>${dueTasks || "<li>Nenhuma tarefa vencendo hoje.</li>"}</ul>
  `;

  renderStatusChart(report.statusCount || {});
}

function renderStatusChart(statusCount) {
  const labels = Object.keys(statusLabel);
  const values = labels.map((status) => Number(statusCount[status] || 0));

  if (state.statusChart) {
    state.statusChart.destroy();
  }

  state.statusChart = new Chart(elements.statusChart, {
    type: "bar",
    data: {
      labels: labels.map((status) => statusLabel[status]),
      datasets: [
        {
          label: "Tarefas por status",
          data: values,
          backgroundColor: ["#7c90b3", "#3b82f6", "#f59e0b", "#16a34a"]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

async function downloadDailyPng() {
  try {
    const base64 = await captureDailySectionBase64();
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${base64}`;
    link.download = `relatorio-diario-${elements.dailyDate.value || todayIso()}.png`;
    link.click();
    notify("Imagem PNG gerada.");
  } catch (error) {
    notify(`Erro ao exportar PNG: ${error.message}`);
  }
}

async function downloadDailyPdf() {
  try {
    const base64 = await captureDailySectionBase64();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const availableWidth = pageWidth - margin * 2;
    const ratio = image.height / image.width;
    const imageHeight = availableWidth * ratio;
    const adjustedHeight = Math.min(imageHeight, pageHeight - margin * 2);

    doc.addImage(image, "PNG", margin, margin, availableWidth, adjustedHeight);
    doc.save(`relatorio-diario-${elements.dailyDate.value || todayIso()}.pdf`);
    notify("PDF gerado.");
  } catch (error) {
    notify(`Erro ao exportar PDF: ${error.message}`);
  }
}

async function handleSendEmail(event) {
  event.preventDefault();
  const to = elements.emailTo.value.trim();
  const subject = elements.emailSubject.value.trim();
  const message = elements.emailMessage.value.trim();

  if (!to || !subject) {
    notify("Informe destinatario e assunto.");
    return;
  }

  try {
    const attachmentBase64 = await captureDailySectionBase64();
    const result = await apiFetch("/api/reports/email", {
      method: "POST",
      body: JSON.stringify({
        to,
        subject,
        message: message || `Relatorio diario ${elements.dailyDate.value || todayIso()}`,
        attachmentBase64,
        fileName: `relatorio-diario-${elements.dailyDate.value || todayIso()}.png`,
        mimeType: "image/png"
      })
    });

    elements.emailStatus.textContent = `E-mail enviado. Message-ID: ${result.messageId || "n/a"}`;
    notify("Email enviado com sucesso.");
  } catch (error) {
    elements.emailStatus.textContent = `Falha no envio: ${error.message}`;
    notify(`Erro ao enviar email: ${error.message}`);
  }
}

async function captureDailySectionBase64() {
  if (state.lastReportImageBase64) {
    return state.lastReportImageBase64;
  }
  const target = elements.dailyReport.closest(".card");
  const canvas = await html2canvas(target, { scale: 2 });
  const base64 = canvas.toDataURL("image/png").split(",")[1];
  state.lastReportImageBase64 = base64;
  return base64;
}

async function apiFetch(endpoint, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  if (state.idToken) {
    headers.Authorization = `Bearer ${state.idToken}`;
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body.error) {
        message = body.error;
      }
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function notify(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  window.clearTimeout(notify._timer);
  notify._timer = window.setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 2800);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

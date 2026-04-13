"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  getFirebaseClientAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase-client";
import {
  Board,
  DailySummary,
  GanttItem,
  KanbanTask,
  ScheduleShift,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";

type ApiErrorPayload = {
  error?: string;
};

type CreateTaskDraft = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  shiftId: string;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A Fazer",
  doing: "Em Andamento",
  done: "Concluído",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-amber-500",
  doing: "bg-blue-500",
  done: "bg-emerald-500",
};

function dateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return payload.error ?? "Falha na operação.";
  } catch {
    return "Falha na operação.";
  }
}

async function apiCall<T>(
  token: string,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

async function downloadAsset(token: string, url: string, filename: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export default function Home() {
  const firebaseConfigured = isFirebaseClientConfigured();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState("default");
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [shifts, setShifts] = useState<ScheduleShift[]>([]);
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([]);
  const [ganttSvg, setGanttSvg] = useState<string | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);

  const [taskDraft, setTaskDraft] = useState<CreateTaskDraft>({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    startDate: dateInputValue(),
    dueDate: "",
    shiftId: "",
  });

  const [reportDate, setReportDate] = useState(dateInputValue());
  const [emailTo, setEmailTo] = useState("");
  const [emailFormat, setEmailFormat] = useState<"pdf" | "png" | "svg">("pdf");

  const [busy, setBusy] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const tasksByStatus = useMemo(() => {
    return TASK_STATUSES.reduce<Record<TaskStatus, KanbanTask[]>>(
      (acc, status) => {
        acc[status] = tasks.filter((task) => task.status === status);
        return acc;
      },
      {
        todo: [],
        doing: [],
        done: [],
      },
    );
  }, [tasks]);

  async function refreshWorkspace(idToken: string, boardId?: string) {
    setLoadingWorkspace(true);
    setError("");

    try {
      const boardPayload = await apiCall<{ boards: Board[] }>(idToken, "/api/boards");
      const nextBoardId = boardId ?? boardPayload.boards[0]?.id ?? "default";

      setBoards(boardPayload.boards);
      setSelectedBoardId(nextBoardId);

      const [taskPayload, shiftPayload, ganttPayload, dailyPayload] = await Promise.all([
        apiCall<{ tasks: KanbanTask[] }>(
          idToken,
          `/api/tasks?boardId=${encodeURIComponent(nextBoardId)}`,
        ),
        apiCall<{ shifts: ScheduleShift[] }>(idToken, "/api/integrations/schedule/shifts"),
        apiCall<{ generatedAt: string; items: GanttItem[] }>(
          idToken,
          `/api/reports/gantt?boardId=${encodeURIComponent(nextBoardId)}`,
        ),
        apiCall<{ generatedAt: string; summary: DailySummary }>(
          idToken,
          `/api/reports/daily?boardId=${encodeURIComponent(nextBoardId)}&date=${reportDate}`,
        ),
      ]);

      setTasks(taskPayload.tasks);
      setShifts(shiftPayload.shifts);
      setGanttItems(ganttPayload.items);
      setDailySummary(dailyPayload.summary);

      const svgResponse = await fetch(
        `/api/reports/gantt?boardId=${encodeURIComponent(nextBoardId)}&as=svg`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );
      if (svgResponse.ok) {
        setGanttSvg(await svgResponse.text());
      } else {
        setGanttSvg(null);
      }
    } finally {
      setLoadingWorkspace(false);
    }
  }

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthLoading(false);
      return;
    }

    const auth = getFirebaseClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setMessage("");
      setError("");

      if (!user) {
        setToken(null);
        setAuthLoading(false);
        setBoards([]);
        setTasks([]);
        setShifts([]);
        setGanttItems([]);
        setGanttSvg(null);
        setDailySummary(null);
        return;
      }

      try {
        const nextToken = await user.getIdToken();
        setToken(nextToken);
        await refreshWorkspace(nextToken);
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : "Falha ao carregar dados.");
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
    // reportDate only affects explicit refresh calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseConfigured]);

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!firebaseConfigured) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const auth = getFirebaseClientAuth();
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setMessage("Autenticação concluída.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Falha de autenticação.");
    } finally {
      setBusy(false);
    }
  }

  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const selectedShift = shifts.find((shift) => shift.id === taskDraft.shiftId);
      await apiCall(token, "/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          boardId: selectedBoardId,
          title: taskDraft.title,
          description: taskDraft.description || undefined,
          priority: taskDraft.priority,
          status: taskDraft.status,
          startDate: taskDraft.startDate || undefined,
          dueDate: taskDraft.dueDate || undefined,
          shiftId: taskDraft.shiftId || undefined,
          shiftLabel: selectedShift?.title,
        }),
      });

      setTaskDraft((prev) => ({
        ...prev,
        title: "",
        description: "",
        dueDate: "",
      }));
      await refreshWorkspace(token, selectedBoardId);
      setMessage("Tarefa criada com sucesso.");
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "Erro ao criar tarefa.");
    } finally {
      setBusy(false);
    }
  }

  async function changeTaskStatus(taskId: string, status: TaskStatus) {
    if (!token) {
      return;
    }

    setError("");
    try {
      await apiCall(token, `/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refreshWorkspace(token, selectedBoardId);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Erro ao atualizar tarefa.");
    }
  }

  async function removeTask(taskId: string) {
    if (!token) {
      return;
    }

    setError("");
    try {
      await apiCall(token, `/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      await refreshWorkspace(token, selectedBoardId);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erro ao excluir tarefa.");
    }
  }

  async function syncShifts() {
    if (!token) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const now = new Date();
      const end = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
      const startDate = encodeURIComponent(now.toISOString());
      const endDate = encodeURIComponent(end.toISOString());

      const syncResult = await apiCall<{ message: string; synced: number; warning?: string }>(
        token,
        `/api/integrations/schedule/sync?startDate=${startDate}&endDate=${endDate}`,
        { method: "POST" },
      );

      await refreshWorkspace(token, selectedBoardId);
      if (syncResult.warning) {
        setMessage(`${syncResult.message} ${syncResult.warning}`);
      } else {
        setMessage(`${syncResult.message} (${syncResult.synced} escalas atualizadas)`);
      }
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Erro ao sincronizar escala.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshBoardSelection(boardId: string) {
    if (!token) {
      return;
    }

    setSelectedBoardId(boardId);
    try {
      await refreshWorkspace(token, boardId);
    } catch (boardError) {
      setError(boardError instanceof Error ? boardError.message : "Erro ao trocar quadro.");
    }
  }

  async function exportDaily(format: "pdf" | "png" | "svg") {
    if (!token) {
      return;
    }

    try {
      await downloadAsset(
        token,
        `/api/reports/daily?boardId=${encodeURIComponent(selectedBoardId)}&date=${reportDate}&format=${format}`,
        `daily-report-${reportDate}.${format}`,
      );
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Erro ao baixar relatório diário.",
      );
    }
  }

  async function exportGantt(format: "png" | "svg") {
    if (!token) {
      return;
    }

    try {
      await downloadAsset(
        token,
        `/api/reports/gantt?boardId=${encodeURIComponent(selectedBoardId)}&as=${format}`,
        `gantt-report.${format}`,
      );
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Erro ao baixar Gantt.");
    }
  }

  async function emailReport() {
    if (!token || !emailTo) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiCall(token, "/api/reports/daily/email", {
        method: "POST",
        body: JSON.stringify({
          boardId: selectedBoardId,
          date: reportDate,
          to: emailTo,
          format: emailFormat,
        }),
      });
      setMessage("Relatório enviado por e-mail.");
      setEmailTo("");
    } catch (emailError) {
      setError(emailError instanceof Error ? emailError.message : "Falha no envio do e-mail.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (!firebaseConfigured) {
      return;
    }
    await signOut(getFirebaseClientAuth());
  }

  if (!firebaseConfigured) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl p-8">
        <h1 className="text-3xl font-bold text-slate-900">Kanban Operacional</h1>
        <p className="mt-4 text-slate-700">
          Configure <code>NEXT_PUBLIC_FIREBASE_*</code> e <code>FIREBASE_ADMIN_*</code> para
          habilitar autenticação e APIs.
        </p>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl p-8">
        <p className="text-slate-600">Carregando autenticação...</p>
      </main>
    );
  }

  if (!currentUser || !token) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-8">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Kanban + Escala (Firebase)</h1>
          <p className="mt-2 text-sm text-slate-600">
            Faça login para acessar quadro, relatórios Gantt/diário e disparo por e-mail.
          </p>

          <form className="mt-6 space-y-3" onSubmit={submitAuth}>
            <label className="block text-sm text-slate-700">
              E-mail
              <input
                required
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Senha
              <input
                required
                type="password"
                minLength={6}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {authMode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setAuthMode((mode) => (mode === "signin" ? "signup" : "signin"))}
            className="mt-3 text-sm text-blue-600 underline"
          >
            {authMode === "signin"
              ? "Não tem conta? Criar agora"
              : "Já tem conta? Entrar"}
          </button>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-emerald-600">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl p-6 text-slate-900">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Kanban Operacional Online</h1>
          <p className="text-sm text-slate-600">
            Integração com escala + autenticação Firebase + relatórios Gantt/diário.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            {currentUser.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100"
          >
            Sair
          </button>
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <section className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[2fr_3fr]">
        <form className="space-y-3" onSubmit={createTask}>
          <h2 className="text-lg font-semibold">Nova tarefa</h2>
          <label className="block text-sm">
            Quadro
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={selectedBoardId}
              onChange={(event) => void refreshBoardSelection(event.target.value)}
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Título
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={taskDraft.title}
              onChange={(event) =>
                setTaskDraft((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
            />
          </label>

          <label className="block text-sm">
            Descrição
            <textarea
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={taskDraft.description}
              onChange={(event) =>
                setTaskDraft((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Prioridade
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={taskDraft.priority}
                onChange={(event) =>
                  setTaskDraft((prev) => ({
                    ...prev,
                    priority: event.target.value as TaskPriority,
                  }))
                }
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Status inicial
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={taskDraft.status}
                onChange={(event) =>
                  setTaskDraft((prev) => ({
                    ...prev,
                    status: event.target.value as TaskStatus,
                  }))
                }
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Início
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={taskDraft.startDate}
                onChange={(event) =>
                  setTaskDraft((prev) => ({
                    ...prev,
                    startDate: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block text-sm">
              Entrega
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={taskDraft.dueDate}
                onChange={(event) =>
                  setTaskDraft((prev) => ({
                    ...prev,
                    dueDate: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="block text-sm">
            Vincular escala
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={taskDraft.shiftId}
              onChange={(event) =>
                setTaskDraft((prev) => ({
                  ...prev,
                  shiftId: event.target.value,
                }))
              }
            >
              <option value="">Sem vínculo</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.title} ({new Date(shift.startAt).toLocaleDateString("pt-BR")})
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-60"
          >
            Criar tarefa
          </button>
        </form>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-semibold">Relatórios e automações</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void syncShifts()}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
            >
              Sincronizar escalas
            </button>
            <button
              type="button"
              onClick={() => void exportGantt("png")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100"
            >
              Exportar Gantt (PNG)
            </button>
            <button
              type="button"
              onClick={() => void exportGantt("svg")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100"
            >
              Exportar Gantt (SVG)
            </button>
            <button
              type="button"
              onClick={() => void exportDaily("pdf")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100"
            >
              Diário PDF
            </button>
            <button
              type="button"
              onClick={() => void exportDaily("png")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100"
            >
              Diário imagem
            </button>
          </div>

          <label className="block text-sm">
            Data do relatório diário
            <input
              type="date"
              className="mt-1 w-56 rounded-lg border border-slate-300 px-3 py-2"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
            />
          </label>

          <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[2fr_1fr_auto]">
            <input
              type="email"
              placeholder="destinatario@empresa.com"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={emailTo}
              onChange={(event) => setEmailTo(event.target.value)}
            />
            <select
              value={emailFormat}
              onChange={(event) =>
                setEmailFormat(event.target.value as "pdf" | "png" | "svg")
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="pdf">PDF</option>
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
            </select>
            <button
              type="button"
              onClick={() => void emailReport()}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500"
            >
              Enviar e-mail
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Visão Gantt rápida ({ganttItems.length} item(ns))
            </h3>
            {ganttSvg ? (
              <div
                className="overflow-auto"
                dangerouslySetInnerHTML={{ __html: ganttSvg }}
              />
            ) : (
              <p className="text-sm text-slate-500">Crie tarefas para ver o gráfico.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Resumo diário</h3>
            {dailySummary ? (
              <ul className="text-sm text-slate-700">
                <li>Total: {dailySummary.totals.all}</li>
                <li>A Fazer: {dailySummary.totals.todo}</li>
                <li>Em andamento: {dailySummary.totals.doing}</li>
                <li>Concluídas: {dailySummary.totals.done}</li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Sem resumo para o período.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <article
            key={status}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="mb-3 text-lg font-semibold">{STATUS_LABELS[status]}</h3>
            <div className="space-y-3">
              {tasksByStatus[status].length === 0 ? (
                <p className="text-sm text-slate-500">Sem tarefas.</p>
              ) : (
                tasksByStatus[status].map((task) => (
                  <div key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <button
                        type="button"
                        className="text-xs text-red-600 underline"
                        onClick={() => void removeTask(task.id)}
                      >
                        excluir
                      </button>
                    </div>
                    {task.description ? (
                      <p className="mb-2 text-sm text-slate-600">{task.description}</p>
                    ) : null}
                    <div className="space-y-1 text-xs text-slate-500">
                      <p>Prioridade: {PRIORITY_LABELS[task.priority]}</p>
                      {task.dueDate ? (
                        <p>Entrega: {new Date(task.dueDate).toLocaleDateString("pt-BR")}</p>
                      ) : null}
                      {task.shiftLabel ? <p>Escala: {task.shiftLabel}</p> : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {TASK_STATUSES.map((statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => void changeTaskStatus(task.id, statusOption)}
                          className={`rounded px-2 py-1 text-xs text-white ${
                            STATUS_COLORS[statusOption]
                          }`}
                        >
                          {STATUS_LABELS[statusOption]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </section>

      {loadingWorkspace ? (
        <p className="mt-4 text-sm text-slate-500">Atualizando dados...</p>
      ) : null}
    </main>
  );
}

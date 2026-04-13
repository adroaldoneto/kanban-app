"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Link2,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { differenceInCalendarDays, eachDayOfInterval, format, parseISO } from "date-fns";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import clsx from "clsx";
import { boardColumns, demoScheduleOverview, demoTasks, demoUser } from "@/lib/demo-data";
import { getAppMode, isFirebaseConfigured } from "@/lib/env";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase";
import { buildDailyReport, buildEmailHtml } from "@/lib/report-utils";
import { loadScheduleOverview } from "@/lib/schedule-adapter";
import type { BoardColumn, Task, TaskPriority, TaskStatus, UserProfile } from "@/lib/types";

const statusMeta: Record<TaskStatus, { label: string; color: string; bg: string; chart: string }> = {
  backlog: { label: "Backlog", color: "text-slate-700", bg: "bg-slate-100", chart: "#94a3b8" },
  planned: { label: "Planejado", color: "text-blue-700", bg: "bg-blue-100", chart: "#3b82f6" },
  in_progress: { label: "Em execucao", color: "text-amber-700", bg: "bg-amber-100", chart: "#f59e0b" },
  review: { label: "Revisao", color: "text-fuchsia-700", bg: "bg-fuchsia-100", chart: "#d946ef" },
  done: { label: "Concluido", color: "text-emerald-700", bg: "bg-emerald-100", chart: "#10b981" },
};

const priorityMeta: Record<TaskPriority, string> = {
  low: "bg-slate-900/5 text-slate-700",
  medium: "bg-blue-900/10 text-blue-700",
  high: "bg-orange-900/10 text-orange-700",
  critical: "bg-red-900/10 text-red-700",
};

const defaultDraft = {
  title: "",
  description: "",
  assignee: "Operacoes",
  priority: "medium" as TaskPriority,
  status: "planned" as TaskStatus,
  startDate: format(new Date(), "yyyy-MM-dd"),
  dueDate: format(new Date(), "yyyy-MM-dd"),
  linkedShiftId: "",
};

function MetricCard({
  title,
  value,
  helper,
  tone = "default",
}: {
  title: string;
  value: string | number;
  helper: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneStyles = {
    default: "bg-white border-slate-200",
    success: "bg-emerald-50 border-emerald-100",
    warning: "bg-amber-50 border-amber-100",
  };

  return (
    <div className={clsx("rounded-3xl border p-5 shadow-sm", toneStyles[tone])}>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
}

function TaskCard({ task, onSelect }: { task: Task; onSelect: (taskId: string) => void }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}
      onClick={() => onSelect(task.id)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{task.title}</p>
          <p className="mt-1 text-xs text-slate-500">{task.assignee}</p>
        </div>
        <span className={clsx("rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase", priorityMeta[task.priority])}>
          {task.priority}
        </span>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-slate-600">{task.description}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{format(parseISO(task.dueDate), "dd/MM")}</span>
        <span>{task.percentComplete}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${task.percentComplete}%` }} />
      </div>
    </button>
  );
}

function KanbanColumn({
  column,
  tasks,
  onDropTask,
  onSelectTask,
}: {
  column: BoardColumn;
  tasks: Task[];
  onDropTask: (taskId: string, status: TaskStatus) => void;
  onSelectTask: (taskId: string) => void;
}) {
  const meta = statusMeta[column.id];

  return (
    <section
      className="flex min-h-[360px] flex-col rounded-3xl border border-slate-200 bg-slate-50 p-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData("text/plain");
        if (taskId) {
          onDropTask(taskId, column.id);
        }
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", meta.bg, meta.color)}>{meta.label}</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{tasks.length}</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">{column.description}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onSelect={onSelectTask} />
        ))}
        {!tasks.length ? <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-400">Arraste cards para esta coluna.</div> : null}
      </div>
    </section>
  );
}

function GanttView({ tasks }: { tasks: Task[] }) {
  const sortedTasks = [...tasks].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const start = sortedTasks.length ? parseISO(sortedTasks[0].startDate) : new Date();
  const end = sortedTasks.length ? parseISO(sortedTasks[sortedTasks.length - 1].dueDate) : new Date();
  const safeEnd = differenceInCalendarDays(end, start) < 3 ? new Date(start.getTime() + 3 * 86400000) : end;
  const days = eachDayOfInterval({ start, end: safeEnd });

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid min-w-[980px] gap-y-3" style={{ gridTemplateColumns: `260px repeat(${days.length}, minmax(54px, 1fr))` }}>
        <div className="sticky left-0 z-10 rounded-l-2xl bg-white p-3 text-sm font-semibold text-slate-700">Task / Responsavel</div>
        {days.map((day) => (
          <div key={day.toISOString()} className="p-3 text-center text-xs font-semibold text-slate-500">
            <div>{format(day, "dd/MM")}</div>
            <div className="mt-1 text-[10px] uppercase text-slate-400">{format(day, "EEE")}</div>
          </div>
        ))}
        {sortedTasks.map((task) => {
          const startIndex = differenceInCalendarDays(parseISO(task.startDate), start);
          const endIndex = differenceInCalendarDays(parseISO(task.dueDate), start);
          return (
            <div key={task.id} className="contents">
              <div className="sticky left-0 z-10 rounded-l-2xl bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">{task.assignee}</p>
              </div>
              {days.map((day, index) => {
                const active = index >= startIndex && index <= endIndex;
                const starts = index === startIndex;
                const ends = index === endIndex;
                return (
                  <div key={`${task.id}-${day.toISOString()}`} className="px-1 py-3">
                    <div
                      className={clsx(
                        "h-8 border border-slate-100",
                        active ? "bg-blue-500/80" : "bg-slate-50",
                        starts && "rounded-l-xl",
                        ends && "rounded-r-xl",
                      )}
                      title={`${task.title} - ${task.percentComplete}%`}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function KanbanDashboard() {
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [schedule, setSchedule] = useState(demoScheduleOverview);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(demoUser);
  const [isClient, setIsClient] = useState(false);
  const [authStatus, setAuthStatus] = useState<"demo" | "loading" | "authenticated" | "signed_out">(
    isFirebaseConfigured() ? "loading" : "demo",
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string>(demoTasks[0]?.id ?? "");
  const [draft, setDraft] = useState(defaultDraft);
  const [feedback, setFeedback] = useState<string>("Modo demonstracao ativo ate conectar Firebase e a API de escala.");
  const [emailTarget, setEmailTarget] = useState(demoUser.email);
  const [sendingEmail, setSendingEmail] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadScheduleOverview().then((data) => {
      if (!cancelled) {
        setSchedule(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setCurrentUser(demoUser);
      setAuthStatus("demo");
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthStatus("demo");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          name: user.displayName ?? "Usuario Firebase",
          email: user.email ?? "usuario@firebase.local",
          role: "Usuario autenticado",
          avatar: user.photoURL ?? undefined,
        });
        setAuthStatus("authenticated");
        if (user.email) {
          setEmailTarget(user.email);
        }
      } else {
        setCurrentUser(null);
        setAuthStatus("signed_out");
      }
    });

    return () => unsubscribe();
  }, []);

  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null, [selectedTaskId, tasks]);
  const dailyReport = useMemo(() => buildDailyReport(tasks, schedule), [tasks, schedule]);

  const statusChartData = useMemo(
    () =>
      boardColumns.map((column) => ({
        name: statusMeta[column.id].label,
        value: tasks.filter((task) => task.status === column.id).length,
        color: statusMeta[column.id].chart,
      })),
    [tasks],
  );

  const workloadData = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((task) => map.set(task.assignee, (map.get(task.assignee) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, total]) => ({ name, total }));
  }, [tasks]);

  const completionRate = Math.round(tasks.reduce((total, task) => total + task.percentComplete, 0) / Math.max(tasks.length, 1));
  const overdueCount = tasks.filter((task) => task.status !== "done" && parseISO(task.dueDate) < new Date()).length;

  const chartPlaceholder = (
    <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
      Grafico carregado no navegador
    </div>
  );

  function updateTaskStatus(taskId: string, status: TaskStatus) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              updatedAt: new Date().toISOString(),
              percentComplete: status === "done" ? 100 : task.percentComplete,
            }
          : task,
      ),
    );
    setFeedback(`Task movida para ${statusMeta[status].label}.`);
  }

  function handleDraftChange<K extends keyof typeof draft>(field: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setFeedback("Informe um titulo para criar a task.");
      return;
    }

    const nextTask: Task = {
      id: typeof crypto !== "undefined" ? crypto.randomUUID() : `task-${Date.now()}`,
      title: draft.title.trim(),
      description: draft.description.trim() || "Sem descricao detalhada.",
      assignee: draft.assignee.trim() || "Operacoes",
      priority: draft.priority,
      status: draft.status,
      startDate: new Date(`${draft.startDate}T08:00:00`).toISOString(),
      dueDate: new Date(`${draft.dueDate}T18:00:00`).toISOString(),
      percentComplete: draft.status === "done" ? 100 : draft.status === "review" ? 85 : draft.status === "in_progress" ? 45 : 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      labels: ["manual"],
      linkedShiftId: draft.linkedShiftId || undefined,
      scheduleRef: draft.linkedShiftId ? `LINK-${draft.linkedShiftId}` : undefined,
      blockers: [],
    };

    setTasks((current) => [nextTask, ...current]);
    setSelectedTaskId(nextTask.id);
    setDraft(defaultDraft);
    setFeedback("Nova task adicionada ao quadro.");
  }

  async function exportSectionAsImage() {
    if (!reportRef.current) {
      return null;
    }

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(reportRef.current, { backgroundColor: "#f4f7fb", scale: 2 });
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `relatorio-diario-${format(new Date(), "yyyy-MM-dd")}.png`;
    link.click();
    setFeedback("Imagem do relatorio exportada com sucesso.");
    return dataUrl;
  }

  async function exportSectionAsPdf() {
    if (!reportRef.current) {
      return;
    }

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(reportRef.current, { backgroundColor: "#f4f7fb", scale: 2 });
    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = Math.min((canvas.height * pageWidth) / canvas.width, pdf.internal.pageSize.getHeight());
    pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.save(`relatorio-diario-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    setFeedback("PDF do relatorio gerado com sucesso.");
  }

  async function handleSendEmail() {
    if (!emailTarget.trim()) {
      setFeedback("Informe um email de destino.");
      return;
    }

    setSendingEmail(true);
    try {
      let attachmentDataUrl: string | undefined;
      if (reportRef.current) {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(reportRef.current, { backgroundColor: "#f4f7fb", scale: 2 });
        attachmentDataUrl = canvas.toDataURL("image/png");
      }

      const response = await fetch("/api/email-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTarget,
          subject: `Relatorio diario Kanban Escala Suite - ${dailyReport.date}`,
          html: buildEmailHtml(dailyReport, tasks, schedule),
          attachmentName: `relatorio-diario-${format(new Date(), "yyyy-MM-dd")}.png`,
          attachmentDataUrl,
        }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Falha ao disparar email.");
      }

      setFeedback("Email enviado com sucesso. Confira sua caixa de saida configurada no SMTP.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel enviar o email.");
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleSignIn() {
    const auth = getFirebaseAuth();
    if (!auth) {
      setFeedback("Firebase ainda nao configurado. Preencha o .env.local para autenticar de verdade.");
      return;
    }

    try {
      await signInWithPopup(auth, getGoogleProvider());
      setFeedback("Login realizado com sucesso via Firebase.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Falha ao autenticar com Firebase.");
    }
  }

  async function handleSignOut() {
    const auth = getFirebaseAuth();
    if (!auth) {
      setCurrentUser(demoUser);
      setAuthStatus("demo");
      setFeedback("Modo demo restaurado.");
      return;
    }

    await signOut(auth);
    setFeedback("Sessao encerrada.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Kanban online</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Integrado a escalas</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Gantt + relatorios</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-5xl">Kanban Escala Suite</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 lg:text-lg">
              Painel unificado para operar tarefas, sincronizar com a escala existente, autenticar via Firebase, exportar relatorios diarios em PDF ou imagem e disparar resumos por email.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2"><ShieldCheck className="h-4 w-4" /> Autenticacao: {isFirebaseConfigured() ? "Firebase pronto" : "modo demo"}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2"><Link2 className="h-4 w-4" /> Escala: {schedule.connected ? "API conectada" : "adapter demo"}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2"><CalendarRange className="h-4 w-4" /> Ambiente: {getAppMode()}</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:min-w-[320px]">
            <p className="text-sm font-semibold text-slate-900">Acesso do usuario</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-semibold text-white">
                {currentUser?.name?.slice(0, 1) ?? "?"}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{currentUser?.name ?? "Nao autenticado"}</p>
                <p className="text-sm text-slate-500">{currentUser?.email ?? "Configure Firebase para login real"}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={handleSignIn} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><LogIn className="h-4 w-4" /> Entrar</button>
              <button type="button" onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LogOut className="h-4 w-4" /> Sair</button>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">Status da sessao: {authStatus}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Cards ativos" value={tasks.length} helper="Total de demandas no quadro sincronizavel." />
        <MetricCard title="Conclusao media" value={`${completionRate}%`} helper="Percentual medio de progresso do quadro." tone="success" />
        <MetricCard title="Alertas de escala" value={schedule.alerts.length} helper="Pendencias e observacoes do adapter de escala." tone="warning" />
        <MetricCard title="Atrasos" value={overdueCount} helper="Tasks vencidas e ainda nao concluidas." tone={overdueCount ? "warning" : "success"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_360px]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Quadro Kanban operacional</h2>
              <p className="text-sm text-slate-500">Arraste os cards entre as colunas para atualizar o fluxo.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sincronismo com escala por adapter</div>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-5">
            {boardColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasks.filter((task) => task.status === column.id)}
                onDropTask={updateTaskStatus}
                onSelectTask={setSelectedTaskId}
              />
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Nova task</h2>
            <p className="mt-1 text-sm text-slate-500">Cadastre cards e vincule ao turno da escala.</p>
            <form className="mt-4 space-y-3" onSubmit={handleCreateTask}>
              <input value={draft.title} onChange={(event) => handleDraftChange("title", event.target.value)} placeholder="Titulo da demanda" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none placeholder:text-slate-400 focus:border-blue-500" />
              <textarea value={draft.description} onChange={(event) => handleDraftChange("description", event.target.value)} placeholder="Descricao" rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none placeholder:text-slate-400 focus:border-blue-500" />
              <div className="grid gap-3 md:grid-cols-2">
                <input value={draft.assignee} onChange={(event) => handleDraftChange("assignee", event.target.value)} placeholder="Responsavel" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500" />
                <select value={draft.priority} onChange={(event) => handleDraftChange("priority", event.target.value as TaskPriority)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500">
                  <option value="low">Baixa</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Critica</option>
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select value={draft.status} onChange={(event) => handleDraftChange("status", event.target.value as TaskStatus)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500">
                  {boardColumns.map((column) => (
                    <option key={column.id} value={column.id}>{statusMeta[column.id].label}</option>
                  ))}
                </select>
                <select value={draft.linkedShiftId} onChange={(event) => handleDraftChange("linkedShiftId", event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500">
                  <option value="">Sem vinculo com turno</option>
                  {schedule.shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>{shift.title} - {shift.team}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="date" value={draft.startDate} onChange={(event) => handleDraftChange("startDate", event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500" />
                <input type="date" value={draft.dueDate} onChange={(event) => handleDraftChange("dueDate", event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500" />
              </div>
              <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Adicionar card ao Kanban</button>
            </form>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Task selecionada</h2>
            {selectedTask ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", statusMeta[selectedTask.status].bg, statusMeta[selectedTask.status].color)}>{statusMeta[selectedTask.status].label}</span>
                    <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold uppercase", priorityMeta[selectedTask.priority])}>{selectedTask.priority}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">{selectedTask.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{selectedTask.description}</p>
                </div>
                <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Responsavel</p><p className="mt-1 font-semibold text-slate-900">{selectedTask.assignee}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Referencia da escala</p><p className="mt-1 font-semibold text-slate-900">{selectedTask.scheduleRef ?? "Sem vinculo"}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Inicio</p><p className="mt-1 font-semibold text-slate-900">{format(parseISO(selectedTask.startDate), "dd/MM/yyyy")}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Entrega</p><p className="mt-1 font-semibold text-slate-900">{format(parseISO(selectedTask.dueDate), "dd/MM/yyyy")}</p></div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-500"><span>Progresso</span><span>{selectedTask.percentComplete}%</span></div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-blue-600" style={{ width: `${selectedTask.percentComplete}%` }} /></div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Etiquetas</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTask.labels.map((label) => (
                      <span key={label} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">#{label}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Selecione um card para ver detalhes.</p>
            )}
          </section>
        </aside>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Cronograma geral em grafico Gantt</h2>
            <p className="text-sm text-slate-500">Visualizacao executiva das entregas e das janelas relacionadas a operacao.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Atualizado em {format(new Date(schedule.lastSync), "dd/MM HH:mm")}</div>
        </div>
        <div className="mt-5"><GanttView tasks={tasks} /></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div ref={reportRef} className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Relatorios e indicadores</h2>
              <p className="text-sm text-slate-500">Base para PDF, imagem diaria e resumo executivo.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportSectionAsPdf} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" /> PDF</button>
              <button type="button" onClick={exportSectionAsImage} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ImageIcon className="h-4 w-4" /> Foto</button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Entregas / dia" value={dailyReport.completedTasks} helper="Concluidas ou prontas para homologacao." tone="success" />
            <MetricCard title="Em andamento" value={dailyReport.inFlightTasks} helper="Cards sob acompanhamento ativo." />
            <MetricCard title="Turnos ativos" value={dailyReport.activeShiftCount} helper="Escalas do dia ligadas ao quadro." />
            <MetricCard title="Atrasos" value={dailyReport.overdueTasks} helper="Demandas que exigem replanejamento." tone={dailyReport.overdueTasks ? "warning" : "success"} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">Distribuicao por status</p>
              {isClient ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92} paddingAngle={4}>
                        {statusChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                chartPlaceholder
              )}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">Carga por responsavel</p>
              {isClient ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workloadData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                chartPlaceholder
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Relatorio diario - {dailyReport.date}</div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {dailyReport.highlights.map((highlight) => (
                  <li key={highlight} className="rounded-2xl bg-white px-4 py-3">{highlight}</li>
                ))}
              </ul>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><AlertTriangle className="h-4 w-4 text-amber-600" /> Bloqueios</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {(dailyReport.blockers.length ? dailyReport.blockers : ["Sem bloqueios criticos hoje."]).map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><TimerReset className="h-4 w-4 text-blue-600" /> Alertas da escala</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {schedule.alerts.map((alert) => (
                      <li key={alert}>- {alert}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Enviar por email</p>
              <p className="mt-1 text-sm text-slate-500">Dispare o resumo diario com o print do dashboard anexado.</p>
              <input type="email" value={emailTarget} onChange={(event) => setEmailTarget(event.target.value)} placeholder="destino@empresa.com" className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none placeholder:text-slate-400 focus:border-blue-500" />
              <button type="button" disabled={sendingEmail} onClick={handleSendEmail} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"><Mail className="h-4 w-4" /> {sendingEmail ? "Enviando..." : "Enviar relatorio por email"}</button>
              <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">O que ja esta pronto</p>
                <ul className="mt-2 space-y-2">
                  <li>- PDF do relatorio</li>
                  <li>- Exportacao em imagem</li>
                  <li>- Endpoint SMTP para envio</li>
                  <li>- Adaptador para integrar com o sistema de escala</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Resumo da integracao com escala</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {schedule.shifts.map((shift) => (
                <div key={shift.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{shift.title}</p>
                    <span className={clsx("rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase", shift.status === "confirmed" && "bg-emerald-100 text-emerald-700", shift.status === "scheduled" && "bg-blue-100 text-blue-700", shift.status === "attention" && "bg-amber-100 text-amber-700")}>{shift.status}</span>
                  </div>
                  <p className="mt-1">{shift.team} · {format(parseISO(shift.date), "dd/MM/yyyy")} · {shift.startTime} - {shift.endTime}</p>
                  <p className="mt-1 text-xs text-slate-500">Slots previstos: {shift.slots}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Checklist de implantacao</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {schedule.integrationNotes.map((note) => (
                <li key={note} className="rounded-2xl bg-slate-50 px-4 py-3">{note}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-300">Feedback do sistema</p>
            <p className="mt-3 text-sm leading-6 text-slate-100">{feedback}</p>
          </section>
        </aside>
      </section>
    </main>
  );
}

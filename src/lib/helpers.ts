import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";

import type {
  BoardStats,
  DailyReportSummary,
  KanbanTask,
  ScheduleShift,
  TaskPriority,
  TaskStatus,
} from "@/types";

export const statusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "A fazer",
  in_progress: "Em andamento",
  done: "Concluído",
};

export const statusToneMap: Record<TaskStatus, string> = {
  backlog: "neutral",
  todo: "primary",
  in_progress: "warning",
  done: "success",
};

export const priorityClassMap: Record<TaskPriority, string> = {
  Baixa: "tag-success",
  Média: "tag-neutral",
  Alta: "tag-warning",
  Crítica: "tag-danger",
};

export function defaultProgressForStatus(status: TaskStatus): number {
  switch (status) {
    case "backlog":
      return 15;
    case "todo":
      return 35;
    case "in_progress":
      return 65;
    case "done":
      return 100;
  }
}

export function normalizeDateRange(startDate: string, endDate: string): [string, string] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [startDate, endDate];
  }

  if (start.getTime() <= end.getTime()) {
    return [format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd")];
  }

  return [format(end, "yyyy-MM-dd"), format(start, "yyyy-MM-dd")];
}

export function sortTasksByTimeline(a: KanbanTask, b: KanbanTask): number {
  if (a.startDate !== b.startDate) {
    return a.startDate.localeCompare(b.startDate);
  }

  if (a.endDate !== b.endDate) {
    return a.endDate.localeCompare(b.endDate);
  }

  return a.title.localeCompare(b.title);
}

export function isTaskOverdue(task: KanbanTask, reference = new Date()): boolean {
  if (task.status === "done") {
    return false;
  }

  return endOfDay(parseISO(task.endDate)).getTime() < reference.getTime();
}

export function formatTaskDateRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, "dd/MM")} - ${format(end, "dd/MM")}`;
}

export function formatShiftWindow(start: string, end: string): string {
  return `${format(new Date(start), "dd/MM HH:mm")} - ${format(new Date(end), "dd/MM HH:mm")}`;
}

export function getShiftName(shiftId: string, shifts: ScheduleShift[]): string {
  return shifts.find((shift) => shift.id === shiftId)?.collaborator ?? "Sem vínculo de turno";
}

export function getTaskStats(tasks: KanbanTask[], schedule: ScheduleShift[]): BoardStats {
  const scheduledPeople = new Set(schedule.map((shift) => shift.collaborator)).size;
  const today = startOfDay(new Date()).getTime();

  return {
    totalTasks: tasks.length,
    completed: tasks.filter((task) => task.status === "done").length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    overdue: tasks.filter((task) => isTaskOverdue(task)).length,
    scheduledPeople,
    upcomingShifts: schedule.filter((shift) => new Date(shift.start).getTime() >= today).length,
  };
}

export function buildDailyReport(
  tasks: KanbanTask[],
  schedule: ScheduleShift[],
  reference = new Date(),
): DailyReportSummary {
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task, endOfDay(reference))).length;
  const tasksDueToday = tasks.filter((task) => isSameDay(parseISO(task.endDate), reference)).length;
  const scheduledPeople = new Set(schedule.map((shift) => shift.collaborator)).size;

  const highlights = [
    ...tasks
      .filter((task) => task.status === "done")
      .slice(0, 2)
      .map((task) => `${task.title} foi concluída por ${task.assignee}.`),
    ...tasks
      .filter((task) => task.status === "in_progress")
      .slice(0, 2)
      .map((task) => `${task.title} segue em execução com ${task.progress}% de avanço.`),
  ].slice(0, 4);

  const blockers = tasks
    .filter((task) => isTaskOverdue(task, endOfDay(reference)))
    .slice(0, 4)
    .map((task) => `${task.title} está atrasada e exige revisão imediata.`);

  return {
    date: format(reference, "yyyy-MM-dd"),
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    tasksDueToday,
    scheduledPeople,
    highlights: highlights.length > 0 ? highlights : ["Nenhum destaque operacional registrado até agora."],
    blockers: blockers.length > 0 ? blockers : ["Nenhum bloqueio crítico identificado no momento."],
  };
}

export function buildReportEmailHtml(report: DailyReportSummary, tasks: KanbanTask[]): string {
  const dueToday = tasks
    .filter((task) => isSameDay(parseISO(task.endDate), parseISO(report.date)))
    .map((task) => `<li><strong>${task.title}</strong> - ${statusLabels[task.status]} - responsável: ${task.assignee}</li>`)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:24px;">Relatório diário do Kanban</h1>
      <p style="margin:0 0 20px;">Data de referência: <strong>${report.date}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:12px;border:1px solid #cbd5e1;">Cards totais</td>
          <td style="padding:12px;border:1px solid #cbd5e1;">${report.totalTasks}</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #cbd5e1;">Concluídas</td>
          <td style="padding:12px;border:1px solid #cbd5e1;">${report.completedTasks}</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #cbd5e1;">Em andamento</td>
          <td style="padding:12px;border:1px solid #cbd5e1;">${report.inProgressTasks}</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #cbd5e1;">Atrasadas</td>
          <td style="padding:12px;border:1px solid #cbd5e1;">${report.overdueTasks}</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid #cbd5e1;">Pessoas na escala</td>
          <td style="padding:12px;border:1px solid #cbd5e1;">${report.scheduledPeople}</td>
        </tr>
      </table>
      <h2 style="font-size:18px;">Destaques</h2>
      <ul>${report.highlights.map((item) => `<li>${item}</li>`).join("")}</ul>
      <h2 style="font-size:18px;">Bloqueios</h2>
      <ul>${report.blockers.map((item) => `<li>${item}</li>`).join("")}</ul>
      <h2 style="font-size:18px;">Entregas previstas para hoje</h2>
      <ul>${dueToday || "<li>Sem cartões com vencimento hoje.</li>"}</ul>
    </div>
  `;
}

export function getGanttBounds(tasks: KanbanTask[]): { start: Date; end: Date } {
  if (tasks.length === 0) {
    const today = startOfDay(new Date());
    return {
      start: today,
      end: addDays(today, 7),
    };
  }

  const starts = tasks.map((task) => parseISO(task.startDate).getTime());
  const ends = tasks.map((task) => parseISO(task.endDate).getTime());

  return {
    start: new Date(Math.min(...starts)),
    end: new Date(Math.max(...ends)),
  };
}

export function getTaskSpan(task: KanbanTask, startDate: Date): { offset: number; duration: number } {
  const taskStart = parseISO(task.startDate);
  const taskEnd = parseISO(task.endDate);

  return {
    offset: Math.max(0, differenceInCalendarDays(taskStart, startDate)),
    duration: Math.max(1, differenceInCalendarDays(taskEnd, taskStart) + 1),
  };
}

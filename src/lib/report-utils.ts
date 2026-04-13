import { endOfDay, format, isPast, isToday, parseISO } from "date-fns";
import type { DailyReport, ScheduleOverview, Task } from "./types";

export function buildDailyReport(tasks: Task[], schedule: ScheduleOverview): DailyReport {
  const completedTasks = tasks.filter((task) => task.status === "done" || (task.status === "review" && task.percentComplete >= 85)).length;
  const inFlightTasks = tasks.filter((task) => task.status === "in_progress" || task.status === "review").length;
  const overdueTasks = tasks.filter((task) => task.status !== "done" && isPast(endOfDay(parseISO(task.dueDate)))).length;
  const activeShiftCount = schedule.shifts.filter((shift) => isToday(parseISO(shift.date))).length;
  const highlights = [
    `${completedTasks} frente(s) entregues ou prontas para homologacao.`,
    `${inFlightTasks} atividade(s) em acompanhamento ativo no quadro.`,
    `${activeShiftCount} turno(s) da escala relacionados ao Kanban no dia de hoje.`,
  ];
  const blockers = tasks.flatMap((task) => task.blockers ?? []).slice(0, 4);

  return {
    date: format(new Date(), "dd/MM/yyyy"),
    generatedAt: format(new Date(), "dd/MM/yyyy HH:mm"),
    completedTasks,
    inFlightTasks,
    overdueTasks,
    activeShiftCount,
    highlights,
    blockers,
  };
}

export function buildEmailHtml(report: DailyReport, tasks: Task[], schedule: ScheduleOverview) {
  const rows = tasks
    .map(
      (task) => `
        <tr>
          <td style="padding:8px;border:1px solid #dbe4f0;">${task.title}</td>
          <td style="padding:8px;border:1px solid #dbe4f0;">${task.assignee}</td>
          <td style="padding:8px;border:1px solid #dbe4f0;">${task.status}</td>
          <td style="padding:8px;border:1px solid #dbe4f0;">${task.percentComplete}%</td>
        </tr>
      `,
    )
    .join("");

  const alerts = schedule.alerts.map((alert) => `<li>${alert}</li>`).join("");
  const blockers = report.blockers.length ? report.blockers.map((blocker) => `<li>${blocker}</li>`).join("") : "<li>Sem bloqueios relevantes.</li>";

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f7fb;color:#0f172a;padding:24px;">
      <div style="max-width:880px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:20px;padding:24px;">
        <h1 style="margin:0 0 8px;font-size:24px;">Relatorio diario - Kanban Escala Suite</h1>
        <p style="margin:0 0 16px;color:#475569;">Gerado em ${report.generatedAt}</p>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:20px;">
          <div style="padding:16px;border-radius:16px;background:#eff6ff;"><strong>${report.completedTasks}</strong><br/>Entregas</div>
          <div style="padding:16px;border-radius:16px;background:#ecfeff;"><strong>${report.inFlightTasks}</strong><br/>Em andamento</div>
          <div style="padding:16px;border-radius:16px;background:#fef3c7;"><strong>${report.overdueTasks}</strong><br/>Atrasos</div>
          <div style="padding:16px;border-radius:16px;background:#ecfccb;"><strong>${report.activeShiftCount}</strong><br/>Turnos ativos</div>
        </div>
        <h2 style="font-size:18px;">Destaques</h2>
        <ul>${report.highlights.map((item) => `<li>${item}</li>`).join("")}</ul>
        <h2 style="font-size:18px;">Bloqueios</h2>
        <ul>${blockers}</ul>
        <h2 style="font-size:18px;">Alertas de escala</h2>
        <ul>${alerts}</ul>
        <h2 style="font-size:18px;">Resumo do quadro</h2>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #dbe4f0;text-align:left;">Task</th>
              <th style="padding:8px;border:1px solid #dbe4f0;text-align:left;">Responsavel</th>
              <th style="padding:8px;border:1px solid #dbe4f0;text-align:left;">Status</th>
              <th style="padding:8px;border:1px solid #dbe4f0;text-align:left;">Progresso</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

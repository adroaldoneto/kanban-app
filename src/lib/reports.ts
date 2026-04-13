import PDFDocument from "pdfkit";
import sharp from "sharp";

import { DailySummary, GanttItem, KanbanTask, TaskStatus } from "@/lib/types";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A Fazer",
  doing: "Em Andamento",
  done: "Concluído",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "#f59e0b",
  doing: "#3b82f6",
  done: "#16a34a",
};

const STATUS_PROGRESS: Record<TaskStatus, number> = {
  todo: 10,
  doing: 60,
  done: 100,
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function clampDateRange(start: number, end: number) {
  const safeStart = Number.isFinite(start) ? start : Date.now();
  const safeEnd = Number.isFinite(end) ? end : safeStart + DAY_IN_MS;
  if (safeEnd <= safeStart) {
    return { min: safeStart, max: safeStart + DAY_IN_MS };
  }

  return { min: safeStart, max: safeEnd };
}

function sanitizeText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toDateLabel(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function normalizeTaskRange(task: KanbanTask) {
  const startDate =
    task.startDate ?? task.createdAt ?? new Date().toISOString();
  const normalizedStart = new Date(startDate);
  const safeStart = Number.isNaN(normalizedStart.getTime())
    ? new Date()
    : normalizedStart;

  const endDate = task.dueDate
    ? new Date(task.dueDate)
    : new Date(safeStart.getTime() + DAY_IN_MS);
  const safeEnd =
    Number.isNaN(endDate.getTime()) || endDate <= safeStart
      ? new Date(safeStart.getTime() + DAY_IN_MS)
      : endDate;

  return {
    startAt: safeStart.toISOString(),
    endAt: safeEnd.toISOString(),
  };
}

export function buildGanttItems(tasks: KanbanTask[]): GanttItem[] {
  return tasks.map((task) => {
    const range = normalizeTaskRange(task);
    return {
      taskId: task.id,
      title: task.title,
      status: task.status,
      startAt: range.startAt,
      endAt: range.endAt,
      progress: STATUS_PROGRESS[task.status],
    };
  });
}

export function renderGanttSvg(items: GanttItem[]): string {
  const width = 1280;
  const headerHeight = 96;
  const rowHeight = 58;
  const chartTop = 90;
  const leftAxis = 260;
  const chartWidth = width - leftAxis - 48;
  const height = Math.max(260, headerHeight + items.length * rowHeight + 48);

  if (items.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#f8fafc"/><text x="48" y="64" font-size="28" font-family="Arial, sans-serif" fill="#0f172a">Relatório Gantt</text><text x="48" y="124" font-size="18" font-family="Arial, sans-serif" fill="#64748b">Sem tarefas para o período selecionado.</text></svg>`;
  }

  const starts = items.map((item) => new Date(item.startAt).getTime());
  const ends = items.map((item) => new Date(item.endAt).getTime());
  const range = clampDateRange(Math.min(...starts), Math.max(...ends));
  const timelineMs = Math.max(DAY_IN_MS, range.max - range.min);

  const ticks = 6;
  const tickLines = new Array(ticks + 1).fill(null).map((_, index) => {
    const ratio = index / ticks;
    const x = leftAxis + ratio * chartWidth;
    const timestamp = range.min + ratio * timelineMs;
    return `<line x1="${x}" y1="${chartTop - 20}" x2="${x}" y2="${height - 24}" stroke="#cbd5e1" stroke-width="1"/><text x="${x - 34}" y="${chartTop - 28}" fill="#475569" font-size="12" font-family="Arial, sans-serif">${sanitizeText(
      toDateLabel(new Date(timestamp).toISOString()),
    )}</text>`;
  });

  const rows = items.map((item, index) => {
    const y = chartTop + index * rowHeight;
    const taskStart = new Date(item.startAt).getTime();
    const taskEnd = new Date(item.endAt).getTime();
    const x =
      leftAxis + ((taskStart - range.min) / timelineMs) * chartWidth;
    const rawWidth = ((taskEnd - taskStart) / timelineMs) * chartWidth;
    const barWidth = Math.max(18, rawWidth);
    const color = STATUS_COLORS[item.status];
    const title = sanitizeText(item.title);
    const status = sanitizeText(STATUS_LABELS[item.status]);

    return `
      <text x="24" y="${y + 26}" fill="#0f172a" font-size="14" font-family="Arial, sans-serif">${title}</text>
      <text x="24" y="${y + 46}" fill="#64748b" font-size="12" font-family="Arial, sans-serif">${status}</text>
      <rect x="${x}" y="${y + 8}" width="${barWidth}" height="18" rx="8" fill="${color}" opacity="0.92"/>
      <rect x="${x}" y="${y + 33}" width="${barWidth}" height="6" rx="3" fill="#e2e8f0"/>
      <rect x="${x}" y="${y + 33}" width="${(barWidth * item.progress) / 100}" height="6" rx="3" fill="${color}"/>
    `;
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <text x="24" y="42" font-size="28" font-family="Arial, sans-serif" fill="#0f172a">Relatório Geral de Execução (Gantt)</text>
      <text x="24" y="68" font-size="14" font-family="Arial, sans-serif" fill="#475569">Gerado em ${sanitizeText(
        toDateLabel(new Date().toISOString()),
      )}</text>
      ${tickLines.join("")}
      ${rows.join("")}
    </svg>
  `.trim();
}

function sameDay(dateValue: string | undefined, targetDate: string) {
  if (!dateValue) {
    return false;
  }
  return dateValue.slice(0, 10) === targetDate;
}

export function buildDailySummary(tasks: KanbanTask[], date: string): DailySummary {
  const dayTasks = tasks.filter(
    (task) =>
      sameDay(task.dueDate, date) ||
      sameDay(task.startDate, date) ||
      sameDay(task.updatedAt, date),
  );

  const totals = dayTasks.reduce(
    (acc, task) => {
      acc.all += 1;
      acc[task.status] += 1;
      return acc;
    },
    {
      all: 0,
      todo: 0,
      doing: 0,
      done: 0,
    },
  );

  return {
    date,
    totals,
    tasks: dayTasks,
  };
}

export function renderDailySvg(summary: DailySummary): string {
  const width = 1080;
  const cardHeight = 140;
  const height = Math.max(420, 260 + summary.tasks.length * 42);
  const cards = [
    { label: "Total", value: summary.totals.all, color: "#0f172a" },
    { label: "A Fazer", value: summary.totals.todo, color: STATUS_COLORS.todo },
    { label: "Em andamento", value: summary.totals.doing, color: STATUS_COLORS.doing },
    { label: "Concluídas", value: summary.totals.done, color: STATUS_COLORS.done },
  ];

  const cardsSvg = cards
    .map((card, index) => {
      const x = 24 + index * 258;
      return `<rect x="${x}" y="86" width="238" height="${cardHeight}" rx="16" fill="#ffffff" stroke="#e2e8f0"/><text x="${
        x + 24
      }" y="132" fill="#64748b" font-size="18" font-family="Arial, sans-serif">${sanitizeText(
        card.label,
      )}</text><text x="${x + 24}" y="182" fill="${card.color}" font-size="38" font-family="Arial, sans-serif" font-weight="bold">${
        card.value
      }</text>`;
    })
    .join("");

  const tasks = summary.tasks
    .slice(0, 12)
    .map((task, index) => {
      const y = 274 + index * 36;
      return `<text x="28" y="${y}" fill="#0f172a" font-size="16" font-family="Arial, sans-serif">• ${sanitizeText(
        task.title,
      )} (${sanitizeText(STATUS_LABELS[task.status])})</text>`;
    })
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <text x="24" y="44" fill="#0f172a" font-size="28" font-family="Arial, sans-serif">Relatório Diário</text>
      <text x="24" y="68" fill="#475569" font-size="16" font-family="Arial, sans-serif">${sanitizeText(
        toDateLabel(summary.date),
      )}</text>
      ${cardsSvg}
      <text x="24" y="244" fill="#334155" font-size="18" font-family="Arial, sans-serif">Tarefas do dia</text>
      ${tasks || `<text x="28" y="286" fill="#64748b" font-size="15" font-family="Arial, sans-serif">Nenhuma tarefa para esta data.</text>`}
    </svg>
  `.trim();
}

async function svgToPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg, "utf-8"))
    .resize({ width: 1400, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();
}

export async function renderGanttPng(items: GanttItem[]) {
  return svgToPng(renderGanttSvg(items));
}

export async function renderDailyPng(summary: DailySummary) {
  return svgToPng(renderDailySvg(summary));
}

export async function renderDailyPdf(summary: DailySummary): Promise<Buffer> {
  const doc = new PDFDocument({
    margin: 48,
    size: "A4",
  });
  const chunks: Uint8Array[] = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk: Uint8Array) => {
      chunks.push(chunk);
    });
    doc.on("error", reject);
    doc.on("end", () => {
      resolve(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
    });

    doc
      .fontSize(20)
      .fillColor("#0f172a")
      .text("Relatório Diário - Kanban");
    doc
      .moveDown(0.4)
      .fontSize(12)
      .fillColor("#475569")
      .text(`Data: ${toDateLabel(summary.date)}`);

    doc.moveDown(1.4);
    doc
      .fontSize(14)
      .fillColor("#0f172a")
      .text(`Total de tarefas: ${summary.totals.all}`);
    doc
      .moveDown(0.2)
      .fontSize(12)
      .fillColor("#334155")
      .text(`A Fazer: ${summary.totals.todo}`);
    doc.text(`Em andamento: ${summary.totals.doing}`);
    doc.text(`Concluídas: ${summary.totals.done}`);

    doc.moveDown(1.4);
    doc.fontSize(14).fillColor("#0f172a").text("Detalhamento");
    doc.moveDown(0.6);

    if (summary.tasks.length === 0) {
      doc.fontSize(11).fillColor("#64748b").text("Nenhuma tarefa para esta data.");
    } else {
      for (const task of summary.tasks) {
        doc
          .fontSize(11)
          .fillColor("#0f172a")
          .text(
            `• ${task.title} | ${STATUS_LABELS[task.status]} | Prioridade ${task.priority.toUpperCase()}`,
          );
        if (task.description) {
          doc
            .fontSize(10)
            .fillColor("#64748b")
            .text(`  ${task.description}`, {
              paragraphGap: 6,
              indent: 10,
            });
        }
      }
    }

    doc.end();
  });
}

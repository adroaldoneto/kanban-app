import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { KanbanTask, ScheduleShift, Project } from '../types';

export interface ReportData {
  project: Project;
  tasks: KanbanTask[];
  shifts: ScheduleShift[];
  date: Date;
}

export async function generateDailyPDF(data: ReportData): Promise<Blob> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Header background
  doc.setFillColor(30, 30, 50);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('KanFlow', 15, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 220);
  doc.text('Relatório Diário de Progresso', 15, 28);
  doc.text(`${data.project.name} — ${dateStr}`, 15, 36);

  let y = 55;

  // --- Task stats ---
  const total = data.tasks.length;
  const done = data.tasks.filter((t) => t.status === 'done').length;
  const inProgress = data.tasks.filter((t) => t.status === 'in_progress').length;
  const review = data.tasks.filter((t) => t.status === 'review').length;
  const overdue = data.tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < data.date && t.status !== 'done'
  ).length;
  const totalEstimated = data.tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 50);
  doc.text('Resumo do Projeto', 15, y);
  y += 8;

  const statBoxes = [
    { label: 'Total', value: total, color: [99, 102, 241] },
    { label: 'Concluído', value: `${done} (${completionRate}%)`, color: [16, 185, 129] },
    { label: 'Em Progresso', value: inProgress, color: [245, 158, 11] },
    { label: 'Revisão', value: review, color: [139, 92, 246] },
    { label: 'Atrasadas', value: overdue, color: [239, 68, 68] },
    { label: 'Horas Est.', value: `${totalEstimated}h`, color: [59, 130, 246] },
  ];

  const boxW = (pageWidth - 30) / 3;
  statBoxes.forEach((box, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = 15 + col * boxW;
    const by = y + row * 22;

    doc.setFillColor(box.color[0], box.color[1], box.color[2]);
    doc.roundedRect(bx, by, boxW - 4, 18, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(String(box.label), bx + 4, by + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(String(box.value), bx + 4, by + 14);
  });

  y += 50;

  // --- Progress bar ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 50);
  doc.text('Taxa de Conclusão', 15, y);
  y += 6;
  doc.setFillColor(230, 230, 240);
  doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, 'F');
  if (completionRate > 0) {
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(15, y, ((pageWidth - 30) * completionRate) / 100, 8, 2, 2, 'F');
  }
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 120);
  doc.text(`${completionRate}%`, pageWidth - 20, y + 5.5, { align: 'right' });
  y += 16;

  // --- Tasks table ---
  if (data.tasks.length > 0) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 50);
    doc.text('Tarefas', 15, y);
    y += 7;

    const colWidths = [75, 25, 20, 30, 25];
    const headers = ['Título', 'Status', 'Prior.', 'Entrega', 'Horas'];

    // Header row
    doc.setFillColor(50, 50, 80);
    doc.rect(15, y, pageWidth - 30, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    let hx = 17;
    headers.forEach((h, i) => {
      doc.text(h, hx, y + 5);
      hx += colWidths[i];
    });
    y += 7;

    const statusLabels: Record<string, string> = { done: 'Concluído', in_progress: 'Em Prog.', review: 'Revisão', todo: 'A Fazer', backlog: 'Backlog' };
    const priorityLabels: Record<string, string> = { urgent: 'Urgente', high: 'Alta', medium: 'Média', low: 'Baixa' };

    data.tasks.slice(0, 30).forEach((task, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(idx % 2 === 0 ? 245 : 250, 245, 255);
      doc.rect(15, y, pageWidth - 30, 6.5, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 80);

      const row = [
        task.title.slice(0, 45),
        statusLabels[task.status] || task.status,
        priorityLabels[task.priority] || task.priority,
        task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yy') : '-',
        task.estimatedHours ? `${task.estimatedHours}h` : '-',
      ];
      let rx = 17;
      row.forEach((cell, i) => {
        doc.text(String(cell), rx, y + 4.5);
        rx += colWidths[i];
      });
      y += 6.5;
    });
    y += 8;
  }

  // --- Shifts ---
  if (data.shifts.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 50);
    doc.text('Escalas do Dia', 15, y);
    y += 7;

    doc.setFillColor(50, 50, 80);
    doc.rect(15, y, pageWidth - 30, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Colaborador', 17, y + 5);
    doc.text('Horário', 80, y + 5);
    doc.text('Função', 115, y + 5);
    doc.text('Status', 155, y + 5);
    y += 7;

    data.shifts.forEach((shift, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 245 : 250, 245, 255);
      doc.rect(15, y, pageWidth - 30, 6.5, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 80);
      doc.text(shift.userName.slice(0, 25), 17, y + 4.5);
      doc.text(`${shift.startTime} - ${shift.endTime}`, 80, y + 4.5);
      doc.text(shift.role.slice(0, 20), 115, y + 4.5);
      doc.text(shift.status, 155, y + 4.5);
      y += 6.5;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 170);
    doc.text(
      `KanFlow — Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} — Página ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

export async function captureElementAsImage(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');
  const canvas = await html2canvas(element, {
    backgroundColor: '#0f0f1a',
    scale: 2,
    useCORS: true,
  });
  return canvas.toDataURL('image/png');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDataURL(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

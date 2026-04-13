import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import { DailyReportSummary, KanbanTask } from '../types'

export function buildSummary(tasks: KanbanTask[], date: string): DailyReportSummary {
  const delayed = tasks.filter((task) => task.status !== 'done' && task.dueDate < date).length
  const done = tasks.filter((task) => task.status === 'done').length
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length

  return {
    date,
    total: tasks.length,
    delayed,
    done,
    inProgress,
  }
}

export function exportDailyPdf(tasks: KanbanTask[], summary: DailyReportSummary) {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(`Relatório diário - ${summary.date}`, 14, 18)
  doc.setFontSize(10)
  doc.text(
    `Total: ${summary.total} | Concluídas: ${summary.done} | Em andamento: ${summary.inProgress} | Atrasadas: ${summary.delayed}`,
    14,
    26,
  )

  autoTable(doc, {
    startY: 32,
    head: [['Título', 'Status', 'Responsável', 'Início', 'Entrega', 'Prioridade']],
    body: tasks.map((task) => [
      task.title,
      task.status,
      task.assignee || '-',
      task.startDate,
      task.dueDate,
      task.priority,
    ]),
    styles: { fontSize: 8 },
  })

  doc.save(`relatorio-diario-${summary.date}.pdf`)
}

export async function exportElementAsImage(elementId: string, fileName: string) {
  const target = document.getElementById(elementId)
  if (!target) {
    throw new Error('Elemento do relatório não encontrado para exportação.')
  }

  const canvas = await html2canvas(target, { backgroundColor: '#ffffff' })
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value)))
  if (!blob) {
    throw new Error('Não foi possível gerar imagem.')
  }
  saveAs(blob, fileName)
}

export function buildReportEmailHtml(tasks: KanbanTask[], summary: DailyReportSummary) {
  const rows = tasks
    .map(
      (task) =>
        `<tr><td>${task.title}</td><td>${task.status}</td><td>${task.assignee || '-'}</td><td>${task.startDate}</td><td>${task.dueDate}</td></tr>`,
    )
    .join('')

  return `
    <h2>Relatório diário - ${summary.date}</h2>
    <p>Total: <b>${summary.total}</b> | Concluídas: <b>${summary.done}</b> | Em andamento: <b>${summary.inProgress}</b> | Atrasadas: <b>${summary.delayed}</b></p>
    <table border="1" cellspacing="0" cellpadding="6">
      <thead>
        <tr><th>Título</th><th>Status</th><th>Responsável</th><th>Início</th><th>Entrega</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

import { useMemo, useRef, useState } from 'react'
import { useKanban } from '../contexts/KanbanContext'
import {
  format,
  parseISO,
  differenceInDays,
  startOfDay,
  addDays,
  min as minDate,
  max as maxDate,
  isValid,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, ZoomIn, ZoomOut } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { CardStatus } from '../types'

const STATUS_COLORS: Record<CardStatus, string> = {
  backlog: '#94a3b8',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  review: '#8b5cf6',
  done: '#22c55e',
}

const STATUS_LABELS: Record<CardStatus, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  review: 'Revisão',
  done: 'Concluído',
}

export default function GanttChart() {
  const { cards, currentProject } = useKanban()
  const chartRef = useRef<HTMLDivElement>(null)
  const [dayWidth, setDayWidth] = useState(40)
  const [filterStatus, setFilterStatus] = useState<CardStatus | 'all'>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')

  const filteredCards = useMemo(() => {
    let result = cards.filter((c) => c.startDate || c.dueDate)
    if (filterStatus !== 'all') {
      result = result.filter((c) => c.status === filterStatus)
    }
    if (filterAssignee !== 'all') {
      result = result.filter((c) => c.assignee === filterAssignee)
    }
    return result.sort((a, b) => {
      const aStart = a.startDate || a.createdAt
      const bStart = b.startDate || b.createdAt
      return aStart.localeCompare(bStart)
    })
  }, [cards, filterStatus, filterAssignee])

  const assignees = useMemo(() => {
    return [...new Set(cards.map((c) => c.assignee).filter(Boolean))]
  }, [cards])

  const { dateRange, totalDays } = useMemo(() => {
    if (filteredCards.length === 0) {
      const today = startOfDay(new Date())
      return { dateRange: { start: today, end: addDays(today, 30) }, totalDays: 30 }
    }

    const dates = filteredCards.flatMap((c) => {
      const result: Date[] = []
      if (c.startDate) {
        const d = parseISO(c.startDate)
        if (isValid(d)) result.push(d)
      }
      if (c.dueDate) {
        const d = parseISO(c.dueDate)
        if (isValid(d)) result.push(d)
      }
      if (result.length === 0) {
        result.push(parseISO(c.createdAt))
      }
      return result
    }).filter(isValid)

    if (dates.length === 0) {
      const today = startOfDay(new Date())
      return { dateRange: { start: today, end: addDays(today, 30) }, totalDays: 30 }
    }

    const start = addDays(minDate(dates), -2)
    const end = addDays(maxDate(dates), 5)
    const days = Math.max(differenceInDays(end, start), 14)

    return { dateRange: { start, end }, totalDays: days }
  }, [filteredCards])

  const dayHeaders = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(dateRange.start, i))
  }, [dateRange.start, totalDays])

  function getBarStyle(card: typeof filteredCards[0]) {
    const start = card.startDate ? parseISO(card.startDate) : parseISO(card.createdAt)
    const end = card.dueDate ? parseISO(card.dueDate) : addDays(start, 3)

    const left = Math.max(differenceInDays(start, dateRange.start), 0) * dayWidth
    const width = Math.max(differenceInDays(end, start), 1) * dayWidth

    const progress = card.status === 'done' ? 100
      : card.status === 'review' ? 80
      : card.status === 'in_progress' ? 50
      : card.status === 'todo' ? 10
      : 0

    return { left, width, progress, color: STATUS_COLORS[card.status] }
  }

  async function exportToPDF() {
    if (!chartRef.current) return
    const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('landscape', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    pdf.setFontSize(16)
    pdf.text(`Gantt Chart — ${currentProject?.name || 'Projeto'}`, 14, 15)
    pdf.setFontSize(10)
    pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22)

    pdf.addImage(imgData, 'PNG', 10, 28, pdfWidth - 20, Math.min(pdfHeight, 160))
    pdf.save(`gantt-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  async function exportToImage() {
    if (!chartRef.current) return
    const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true })
    const link = document.createElement('a')
    link.download = `gantt-${format(new Date(), 'yyyy-MM-dd')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum projeto selecionado</h2>
          <p className="text-gray-500">Crie ou selecione um projeto.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gráfico Gantt</h1>
          <p className="text-sm text-gray-500">
            {currentProject.name} — {filteredCards.length} tarefas com datas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="input-field w-auto text-sm"
          >
            <option value="all">Todos Status</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="all">Todos Membros</option>
            {assignees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button onClick={() => setDayWidth(Math.min(dayWidth + 10, 80))} className="p-2 rounded-lg hover:bg-gray-100">
            <ZoomIn size={18} />
          </button>
          <button onClick={() => setDayWidth(Math.max(dayWidth - 10, 20))} className="p-2 rounded-lg hover:bg-gray-100">
            <ZoomOut size={18} />
          </button>
          <button onClick={exportToImage} className="btn-secondary text-sm flex items-center gap-1">
            <Download size={14} />
            PNG
          </button>
          <button onClick={exportToPDF} className="btn-primary text-sm flex items-center gap-1">
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS[key as CardStatus] }} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Gantt Chart */}
      <div ref={chartRef} className="card overflow-x-auto">
        {filteredCards.length > 0 ? (
          <div className="min-w-max">
            {/* Header */}
            <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="w-60 flex-shrink-0 p-3 font-semibold text-sm text-gray-700 border-r border-gray-200">
                Tarefa
              </div>
              <div className="flex">
                {dayHeaders.map((day, i) => {
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6
                  return (
                    <div
                      key={i}
                      className={`text-center border-r border-gray-100 text-xs ${
                        isToday ? 'bg-indigo-50 font-bold text-indigo-700' : isWeekend ? 'bg-gray-50 text-gray-400' : 'text-gray-500'
                      }`}
                      style={{ width: dayWidth, minWidth: dayWidth }}
                    >
                      <div>{format(day, 'EEE', { locale: ptBR })}</div>
                      <div className="font-medium">{format(day, 'dd')}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rows */}
            {filteredCards.map((card) => {
              const bar = getBarStyle(card)
              return (
                <div key={card.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                  <div className="w-60 flex-shrink-0 p-3 border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bar.color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{card.title}</p>
                        <p className="text-xs text-gray-400">{card.assignee || '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex-1" style={{ height: 48 }}>
                    {dayHeaders.map((day, i) => {
                      const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                      return (
                        <div
                          key={i}
                          className={`absolute top-0 bottom-0 border-r border-gray-100 ${
                            isToday ? 'bg-indigo-50/50' : ''
                          }`}
                          style={{ left: i * dayWidth, width: dayWidth }}
                        />
                      )
                    })}
                    <div
                      className="absolute top-2 h-7 rounded-full flex items-center overflow-hidden"
                      style={{
                        left: bar.left,
                        width: Math.max(bar.width, dayWidth),
                        backgroundColor: `${bar.color}30`,
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${bar.progress}%`,
                          backgroundColor: bar.color,
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                        {bar.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <p className="text-lg mb-2">Nenhuma tarefa com datas definidas</p>
            <p className="text-sm">Adicione datas de início e fim nas tarefas do Kanban</p>
          </div>
        )}
      </div>
    </div>
  )
}

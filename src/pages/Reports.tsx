import { useMemo, useRef, useState } from 'react'
import { useKanban } from '../contexts/KanbanContext'
import {
  format,
  parseISO,
  subDays,
  startOfDay,
  isBefore,
  isSameDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  Send,
  FileText,
  Image as ImageIcon,
  CalendarDays,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import emailjs from 'emailjs-com'
import { EMAILJS_CONFIG } from '../config/emailjs'
import { useAuth } from '../contexts/AuthContext'
import type { CardStatus } from '../types'

const STATUS_LABELS: Record<CardStatus, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  review: 'Revisão',
  done: 'Concluído',
}

const STATUS_COLORS: Record<CardStatus, string> = {
  backlog: '#94a3b8',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  review: '#8b5cf6',
  done: '#22c55e',
}

export default function Reports() {
  const { cards, currentProject, schedule, teamMembers } = useKanban()
  const { currentUser } = useAuth()
  const reportRef = useRef<HTMLDivElement>(null)
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [emailTo, setEmailTo] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const reportData = useMemo(() => {
    const total = cards.length
    const completed = cards.filter((c) => c.status === 'done').length
    const inProgress = cards.filter((c) => c.status === 'in_progress').length
    const inReview = cards.filter((c) => c.status === 'review').length
    const todo = cards.filter((c) => c.status === 'todo').length
    const backlog = cards.filter((c) => c.status === 'backlog').length
    const overdue = cards.filter(
      (c) => c.dueDate && isBefore(parseISO(c.dueDate), startOfDay(new Date())) && c.status !== 'done'
    ).length

    const createdToday = cards.filter(
      (c) => c.createdAt && isSameDay(parseISO(c.createdAt), parseISO(reportDate))
    ).length
    const completedToday = cards.filter(
      (c) => c.status === 'done' && c.updatedAt && isSameDay(parseISO(c.updatedAt), parseISO(reportDate))
    ).length

    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0

    const statusDistribution = Object.entries(STATUS_LABELS).map(([key, label]) => ({
      name: label,
      value: cards.filter((c) => c.status === key).length,
      color: STATUS_COLORS[key as CardStatus],
    }))

    const memberStats = teamMembers.map((m) => {
      const memberCards = cards.filter((c) => c.assignee === m.name)
      return {
        name: m.name,
        total: memberCards.length,
        concluídas: memberCards.filter((c) => c.status === 'done').length,
        emAndamento: memberCards.filter((c) => c.status === 'in_progress').length,
      }
    })

    const weekData = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(parseISO(reportDate), 6 - i)
      const dayStr = format(day, 'yyyy-MM-dd')
      return {
        name: format(day, 'dd/MM'),
        criadas: cards.filter((c) => c.createdAt?.startsWith(dayStr)).length,
        concluídas: cards.filter((c) => c.status === 'done' && c.updatedAt?.startsWith(dayStr)).length,
      }
    })

    const scheduleToday = schedule.filter((s) => s.date === reportDate)

    const urgentCards = cards.filter(
      (c) => c.priority === 'urgent' && c.status !== 'done'
    )

    return {
      total,
      completed,
      inProgress,
      inReview,
      todo,
      backlog,
      overdue,
      createdToday,
      completedToday,
      productivity,
      statusDistribution,
      memberStats,
      weekData,
      scheduleToday,
      urgentCards,
    }
  }, [cards, teamMembers, schedule, reportDate])

  async function exportToPDF() {
    if (!reportRef.current) return
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('portrait', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    let position = 0
    const pageHeight = pdf.internal.pageSize.getHeight()

    if (pdfHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    } else {
      let heightLeft = pdfHeight
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight
      }
    }

    pdf.save(`relatorio-${reportDate}.pdf`)
  }

  async function exportToImage() {
    if (!reportRef.current) return
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
    const link = document.createElement('a')
    link.download = `relatorio-${reportDate}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function sendByEmail() {
    if (!emailTo || !reportRef.current) return
    setSendingEmail(true)
    setEmailStatus('idle')

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imageData = canvas.toDataURL('image/png')

      const reportContent = `
RELATÓRIO DIÁRIO — ${currentProject?.name || 'Projeto'}
Data: ${format(parseISO(reportDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}

RESUMO:
• Total de tarefas: ${reportData.total}
• Concluídas: ${reportData.completed} (${reportData.productivity}%)
• Em progresso: ${reportData.inProgress}
• Em revisão: ${reportData.inReview}
• A fazer: ${reportData.todo}
• Atrasadas: ${reportData.overdue}

ATIVIDADE DO DIA:
• Novas tarefas: ${reportData.createdToday}
• Tarefas concluídas: ${reportData.completedToday}

${reportData.urgentCards.length > 0 ? `\nTAREFAS URGENTES:\n${reportData.urgentCards.map((c) => `• ${c.title} (${c.assignee || 'sem atribuição'})`).join('\n')}` : ''}

ESCALA DO DIA:
${reportData.scheduleToday.length > 0
  ? reportData.scheduleToday.map((s) => `• ${s.userName}: ${s.shift === 'morning' ? 'Manhã' : s.shift === 'afternoon' ? 'Tarde' : s.shift === 'night' ? 'Noite' : 'Folga'}`).join('\n')
  : '• Nenhuma escala definida'
}
      `.trim()

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        {
          to_email: emailTo,
          from_name: currentUser?.displayName || 'Kanban Pro',
          subject: `Relatório Diário — ${currentProject?.name} — ${format(parseISO(reportDate), 'dd/MM/yyyy')}`,
          message: reportContent,
          report_image: imageData,
        },
        EMAILJS_CONFIG.publicKey
      )
      setEmailStatus('success')
    } catch (err) {
      console.error('Email error:', err)
      setEmailStatus('error')
    } finally {
      setSendingEmail(false)
      setTimeout(() => setEmailStatus('idle'), 5000)
    }
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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500">{currentProject.name}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-gray-400" />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="input-field w-auto text-sm"
            />
          </div>
          <button onClick={exportToImage} className="btn-secondary text-sm flex items-center gap-1.5">
            <ImageIcon size={14} />
            Exportar PNG
          </button>
          <button onClick={exportToPDF} className="btn-primary text-sm flex items-center gap-1.5">
            <FileText size={14} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Email Sender */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Send size={18} />
          Enviar Relatório por Email
        </h3>
        <div className="flex gap-3 flex-wrap">
          <input
            type="email"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            className="input-field flex-1 min-w-[250px]"
            placeholder="destinatario@email.com"
          />
          <button
            onClick={sendByEmail}
            disabled={sendingEmail || !emailTo}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Send size={14} />
            {sendingEmail ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
        {emailStatus === 'success' && (
          <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
            <CheckCircle size={14} />
            Email enviado com sucesso!
          </div>
        )}
        {emailStatus === 'error' && (
          <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
            <AlertCircle size={14} />
            Erro ao enviar. Verifique as configurações do EmailJS.
          </div>
        )}
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6 bg-white p-6 rounded-xl">
        {/* Report Header */}
        <div className="text-center border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Relatório Diário</h2>
          <p className="text-lg text-indigo-600 font-medium">{currentProject.name}</p>
          <p className="text-gray-500">
            {format(parseISO(reportDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total" value={reportData.total} color="bg-gray-100 text-gray-800" />
          <SummaryCard label="Concluídas" value={reportData.completed} color="bg-green-100 text-green-800" extra={`${reportData.productivity}%`} />
          <SummaryCard label="Em Progresso" value={reportData.inProgress} color="bg-yellow-100 text-yellow-800" />
          <SummaryCard label="Atrasadas" value={reportData.overdue} color="bg-red-100 text-red-800" />
        </div>

        {/* Today Activity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-700">{reportData.createdToday}</p>
            <p className="text-sm text-blue-600">Tarefas criadas hoje</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-700">{reportData.completedToday}</p>
            <p className="text-sm text-green-600">Tarefas concluídas hoje</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Distribuição por Status</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {reportData.statusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Atividade da Semana</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.weekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="criadas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="concluídas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Member Stats */}
        {reportData.memberStats.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Produtividade por Membro</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.memberStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="concluídas" fill="#22c55e" stackId="a" />
                  <Bar dataKey="emAndamento" fill="#f59e0b" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Urgent Cards */}
        {reportData.urgentCards.length > 0 && (
          <div>
            <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
              <AlertCircle size={18} />
              Tarefas Urgentes ({reportData.urgentCards.length})
            </h3>
            <div className="space-y-2">
              {reportData.urgentCards.map((card) => (
                <div key={card.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{card.title}</p>
                    <p className="text-xs text-gray-500">
                      {card.assignee || 'Sem atribuição'}
                      {card.dueDate && ` • Prazo: ${format(parseISO(card.dueDate), 'dd/MM/yyyy')}`}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                    {STATUS_LABELS[card.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Escala do Dia</h3>
          {reportData.scheduleToday.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {reportData.scheduleToday.map((entry) => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-sm">{entry.userName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {entry.shift === 'morning' ? 'Manhã (06-14h)' :
                     entry.shift === 'afternoon' ? 'Tarde (14-22h)' :
                     entry.shift === 'night' ? 'Noite (22-06h)' : 'Folga'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Nenhuma escala definida para este dia</p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
          Relatório gerado pelo Kanban Pro em {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
  extra,
}: {
  label: string
  value: number
  color: string
  extra?: string
}) {
  return (
    <div className={`p-4 rounded-lg text-center ${color}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {extra && <p className="text-xs opacity-75">{extra}</p>}
    </div>
  )
}

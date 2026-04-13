import { useMemo } from 'react'
import { useKanban } from '../contexts/KanbanContext'
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
  LineChart,
  Line,
  Legend,
} from 'recharts'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { format, subDays, parseISO, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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

const PRIORITY_COLORS = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
}

export default function Dashboard() {
  const { cards, currentProject, schedule } = useKanban()

  const stats = useMemo(() => {
    const total = cards.length
    const done = cards.filter((c) => c.status === 'done').length
    const inProgress = cards.filter((c) => c.status === 'in_progress').length
    const overdue = cards.filter(
      (c) => c.dueDate && isBefore(parseISO(c.dueDate), startOfDay(new Date())) && c.status !== 'done'
    ).length

    return { total, done, inProgress, overdue }
  }, [cards])

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    cards.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status as CardStatus] || status,
      value: count,
      color: STATUS_COLORS[status as CardStatus] || '#ccc',
    }))
  }, [cards])

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 }
    cards.forEach((c) => { counts[c.priority] = (counts[c.priority] || 0) + 1 })
    return [
      { name: 'Baixa', value: counts.low, color: PRIORITY_COLORS.low },
      { name: 'Média', value: counts.medium, color: PRIORITY_COLORS.medium },
      { name: 'Alta', value: counts.high, color: PRIORITY_COLORS.high },
      { name: 'Urgente', value: counts.urgent, color: PRIORITY_COLORS.urgent },
    ]
  }, [cards])

  const weeklyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      const dayStr = format(date, 'yyyy-MM-dd')
      const created = cards.filter(
        (c) => c.createdAt && c.createdAt.startsWith(dayStr)
      ).length
      const completed = cards.filter(
        (c) => c.status === 'done' && c.updatedAt && c.updatedAt.startsWith(dayStr)
      ).length
      return {
        name: format(date, 'EEE', { locale: ptBR }),
        criadas: created,
        concluídas: completed,
      }
    })
    return days
  }, [cards])

  const assigneeData = useMemo(() => {
    const counts: Record<string, number> = {}
    cards.forEach((c) => {
      if (c.assignee) counts[c.assignee] = (counts[c.assignee] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, tarefas: count }))
  }, [cards])

  const todaySchedule = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return schedule.filter((s) => s.date === today)
  }, [schedule])

  const recentCards = useMemo(() => {
    return [...cards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)
  }, [cards])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
          {currentProject && (
            <span className="text-lg font-normal text-gray-500 ml-2">
              — {currentProject.name}
            </span>
          )}
        </h1>
        <p className="text-gray-500 mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<ListTodo size={24} />}
          label="Total de Tarefas"
          value={stats.total}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<CheckCircle2 size={24} />}
          label="Concluídas"
          value={stats.done}
          color="bg-green-50 text-green-600"
          subtitle={stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}%` : '0%'}
        />
        <StatCard
          icon={<Clock size={24} />}
          label="Em Progresso"
          value={stats.inProgress}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          icon={<AlertTriangle size={24} />}
          label="Atrasadas"
          value={stats.overdue}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Distribuição por Status</h3>
          <div className="h-64">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Nenhuma tarefa ainda
              </div>
            )}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Atividade Semanal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="criadas" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="concluídas" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Priority Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Por Prioridade</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Member */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Tarefas por Membro</h3>
          <div className="h-56">
            {assigneeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assigneeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="tarefas" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Nenhuma tarefa atribuída
              </div>
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={18} />
            Escala de Hoje
          </h3>
          <div className="space-y-3 max-h-56 overflow-y-auto">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                    {entry.userName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.userName}</p>
                    <p className="text-xs text-gray-500">
                      {entry.shift === 'morning' && 'Manhã'}
                      {entry.shift === 'afternoon' && 'Tarde'}
                      {entry.shift === 'night' && 'Noite'}
                      {entry.shift === 'day_off' && 'Folga'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                Nenhuma escala para hoje
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={18} />
          Atividade Recente
        </h3>
        <div className="divide-y divide-gray-100">
          {recentCards.length > 0 ? (
            recentCards.map((card) => (
              <div key={card.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[card.status] }}
                  />
                  <div>
                    <p className="text-sm font-medium">{card.title}</p>
                    <p className="text-xs text-gray-500">
                      {card.assignee || 'Sem atribuição'} • {STATUS_LABELS[card.status]}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {card.updatedAt
                    ? format(parseISO(card.updatedAt), 'dd/MM HH:mm')
                    : '—'}
                </span>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">
              Nenhuma atividade recente
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  subtitle?: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { useKanban } from '../contexts/KanbanContext'
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Sun,
  Moon,
  Sunset,
  Coffee,
} from 'lucide-react'

const SHIFT_CONFIG = {
  morning: { label: 'Manhã', icon: Sun, color: 'bg-amber-100 text-amber-700', time: '06:00 - 14:00' },
  afternoon: { label: 'Tarde', icon: Sunset, color: 'bg-orange-100 text-orange-700', time: '14:00 - 22:00' },
  night: { label: 'Noite', icon: Moon, color: 'bg-indigo-100 text-indigo-700', time: '22:00 - 06:00' },
  day_off: { label: 'Folga', icon: Coffee, color: 'bg-green-100 text-green-700', time: '' },
} as const

export default function Schedule() {
  const { schedule, currentProject, teamMembers, addScheduleEntry, deleteScheduleEntry } = useKanban()
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMember, setSelectedMember] = useState('')

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))
  }, [currentWeek])

  const membersWithSchedule = useMemo(() => {
    const members = teamMembers.length > 0
      ? teamMembers
      : [...new Set(schedule.map((s) => s.userName))].map((name, i) => ({
          id: `temp-${i}`,
          name,
          email: '',
          role: '',
          avatar: '',
        }))
    return members
  }, [teamMembers, schedule])

  const getEntry = (memberName: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedule.find((s) => s.userName === memberName && s.date === dateStr)
  }

  const handleCellClick = (memberName: string, date: Date) => {
    setSelectedMember(memberName)
    setSelectedDate(format(date, 'yyyy-MM-dd'))
    setShowModal(true)
  }

  const handleAddShift = async (shift: 'morning' | 'afternoon' | 'night' | 'day_off') => {
    if (!currentProject) return
    const existing = schedule.find(
      (s) => s.userName === selectedMember && s.date === selectedDate
    )
    if (existing) {
      await deleteScheduleEntry(existing.id)
    }
    await addScheduleEntry({
      userId: '',
      userName: selectedMember,
      date: selectedDate,
      shift,
      projectId: currentProject.id,
      notes: '',
    })
    setShowModal(false)
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum projeto selecionado</h2>
          <p className="text-gray-500">Crie ou selecione um projeto nas configurações.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escala de Trabalho</h1>
          <p className="text-sm text-gray-500">{currentProject.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-gray-700 min-w-[200px] text-center">
            {format(weekDays[0], "dd 'de' MMM", { locale: ptBR })} —{' '}
            {format(weekDays[6], "dd 'de' MMM yyyy", { locale: ptBR })}
          </span>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="btn-secondary text-sm ml-2"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => (
          <div key={key} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${cfg.color}`}>
            <cfg.icon size={12} />
            {cfg.label}
            {cfg.time && <span className="opacity-75">({cfg.time})</span>}
          </div>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 text-sm font-semibold text-gray-700 min-w-[150px]">
                Membro
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.toISOString()}
                  className={`text-center p-3 text-sm font-semibold min-w-[100px] ${
                    isSameDay(day, new Date())
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700'
                  }`}
                >
                  <div>{format(day, 'EEE', { locale: ptBR })}</div>
                  <div className="text-lg font-bold">{format(day, 'dd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {membersWithSchedule.length > 0 ? (
              membersWithSchedule.map((member) => (
                <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {member.name[0]}
                      </div>
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const entry = getEntry(member.name, day)
                    const shiftCfg = entry ? SHIFT_CONFIG[entry.shift] : null
                    return (
                      <td
                        key={day.toISOString()}
                        className={`text-center p-2 cursor-pointer hover:bg-gray-100 transition-colors ${
                          isSameDay(day, new Date()) ? 'bg-indigo-50/50' : ''
                        }`}
                        onClick={() => handleCellClick(member.name, day)}
                      >
                        {shiftCfg ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${shiftCfg.color}`}>
                            <shiftCfg.icon size={12} />
                            {shiftCfg.label}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  Adicione membros na aba Equipe para gerenciar escalas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => {
          const count = schedule.filter((s) => {
            const sDate = parseISO(s.date)
            return s.shift === key && weekDays.some((d) => isSameDay(d, sDate))
          }).length
          return (
            <div key={key} className="card text-center">
              <cfg.icon size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-500">{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {/* Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold">Definir Turno</h3>
                <p className="text-sm text-gray-500">
                  {selectedMember} — {format(parseISO(selectedDate), "dd 'de' MMM", { locale: ptBR })}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleAddShift(key as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-opacity ${cfg.color}`}
                >
                  <cfg.icon size={20} />
                  <div className="text-left">
                    <p className="font-medium">{cfg.label}</p>
                    {cfg.time && <p className="text-xs opacity-75">{cfg.time}</p>}
                  </div>
                </button>
              ))}
              <button
                onClick={async () => {
                  const existing = schedule.find(
                    (s) => s.userName === selectedMember && s.date === selectedDate
                  )
                  if (existing) await deleteScheduleEntry(existing.id)
                  setShowModal(false)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50"
              >
                <Trash2 size={20} />
                <span className="font-medium">Remover</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

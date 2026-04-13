import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, User } from 'lucide-react';
import { useScheduleStore } from '../stores/scheduleStore';
import { useKanbanStore } from '../stores/kanbanStore';
import { useAuthStore } from '../stores/authStore';
import Header from '../components/layout/Header';
import type { ScheduleShift } from '../types';

const STATUS_COLORS = {
  scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  confirmed: 'bg-green-500/20 text-green-300 border-green-500/30',
  completed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  absent: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const STATUS_LABELS = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  absent: 'Ausente',
};

interface ShiftModalProps {
  date: string;
  onClose: () => void;
  shift?: ScheduleShift;
}

function ShiftModal({ date, onClose, shift }: ShiftModalProps) {
  const { createShift, updateShift, deleteShift } = useScheduleStore();
  const { activeProject } = useKanbanStore();
  const { user } = useAuthStore();
  const [userName, setUserName] = useState(shift?.userName || user?.displayName || '');
  const [startTime, setStartTime] = useState(shift?.startTime || '08:00');
  const [endTime, setEndTime] = useState(shift?.endTime || '17:00');
  const [role, setRole] = useState(shift?.role || '');
  const [notes, setNotes] = useState(shift?.notes || '');
  const [status, setStatus] = useState<ScheduleShift['status']>(shift?.status || 'scheduled');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        userName,
        userId: user?.uid || '',
        date,
        startTime,
        endTime,
        role,
        notes,
        status,
        projectId: activeProject?.id || '',
      };
      if (shift) {
        await updateShift(shift.id, data);
      } else {
        await createShift(data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!shift) return;
    if (confirm('Excluir este turno?')) {
      await deleteShift(shift.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-100">{shift ? 'Editar turno' : 'Novo turno'}</h3>
          <span className="text-sm text-gray-500">{format(new Date(date + 'T12:00'), 'dd/MM/yyyy')}</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Colaborador</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="input pl-9" placeholder="Nome do colaborador" />
            </div>
          </div>

          <div>
            <label className="label">Função / Cargo</label>
            <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="input" placeholder="Ex: Desenvolvedor, Analista" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label flex items-center gap-1"><Clock size={13} /> Início</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label flex items-center gap-1"><Clock size={13} /> Fim</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ScheduleShift['status'])} className="input">
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Concluído</option>
              <option value="absent">Ausente</option>
            </select>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input resize-none" rows={2} placeholder="Observações opcionais" />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <div>
            {shift && (
              <button onClick={handleDelete} className="btn-danger text-sm">
                <Trash2 size={14} className="inline mr-1" /> Excluir
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { shifts, selectedWeek, setSelectedWeek, subscribeShifts } = useScheduleStore();
  const { activeProject } = useKanbanStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editShift, setEditShift] = useState<ScheduleShift | undefined>();

  useEffect(() => {
    if (!activeProject) return;
    const unsub = subscribeShifts(activeProject.id);
    return unsub;
  }, [activeProject?.id]);

  const weekStart = startOfWeek(selectedWeek, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePrevWeek = () => setSelectedWeek(addDays(selectedWeek, -7));
  const handleNextWeek = () => setSelectedWeek(addDays(selectedWeek, 7));

  const handleAddShift = (date: string) => {
    setSelectedDate(date);
    setEditShift(undefined);
    setShowModal(true);
  };

  const handleEditShift = (shift: ScheduleShift) => {
    setSelectedDate(shift.date);
    setEditShift(shift);
    setShowModal(true);
  };

  const totalShiftsThisWeek = shifts.filter((s) =>
    weekDays.some((d) => format(d, 'yyyy-MM-dd') === s.date)
  ).length;

  return (
    <div className="flex flex-col h-full">
      <Header title="Escalas" subtitle={`${totalShiftsThisWeek} turnos esta semana`} />

      {/* Week navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <button onClick={handlePrevWeek} className="btn-secondary flex items-center gap-1 text-sm">
          <ChevronLeft size={16} /> Semana anterior
        </button>

        <h2 className="font-semibold text-gray-200">
          {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} — {format(addDays(weekStart, 6), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </h2>

        <button onClick={handleNextWeek} className="btn-secondary flex items-center gap-1 text-sm">
          Próxima semana <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="grid grid-cols-7 gap-3 min-w-[900px]">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayShifts = shifts.filter((s) => s.date === dateStr);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={dateStr} className={`card p-3 min-h-48 flex flex-col ${isToday ? 'border-indigo-500/50' : ''}`}>
                {/* Day header */}
                <div className={`flex items-center justify-between mb-3 pb-2 border-b border-gray-800`}>
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wider ${isToday ? 'text-indigo-400' : 'text-gray-500'}`}>
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-indigo-300' : 'text-gray-300'}`}>
                      {format(day, 'dd')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddShift(dateStr)}
                    className="w-6 h-6 bg-gray-800 hover:bg-indigo-600 text-gray-400 hover:text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Shifts */}
                <div className="flex-1 space-y-2">
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      onClick={() => handleEditShift(shift)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[shift.status]}`}
                    >
                      <p className="font-medium truncate">{shift.userName}</p>
                      <p className="text-gray-400 mt-0.5">
                        {shift.startTime} - {shift.endTime}
                      </p>
                      {shift.role && <p className="text-gray-500 truncate">{shift.role}</p>}
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-black/20 rounded text-xs">
                        {STATUS_LABELS[shift.status]}
                      </span>
                    </div>
                  ))}

                  {dayShifts.length === 0 && (
                    <div
                      onClick={() => handleAddShift(dateStr)}
                      className="h-full min-h-16 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                    >
                      <p className="text-xs text-gray-600">+ Adicionar</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {(['scheduled', 'confirmed', 'completed', 'absent'] as const).map((status) => {
            const count = shifts.filter(
              (s) => s.status === status && weekDays.some((d) => format(d, 'yyyy-MM-dd') === s.date)
            ).length;
            return (
              <div key={status} className={`card p-3 border ${STATUS_COLORS[status]}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs mt-0.5">{STATUS_LABELS[status]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <ShiftModal
          date={selectedDate}
          shift={editShift}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

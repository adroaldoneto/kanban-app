import { useMemo } from 'react';
import { format, differenceInDays, startOfDay, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart2, AlertTriangle } from 'lucide-react';
import { useKanbanStore } from '../stores/kanbanStore';
import Header from '../components/layout/Header';

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#6366f1',
  low: '#22c55e',
};

const STATUS_COLORS = {
  done: '#10b981',
  in_progress: '#f59e0b',
  review: '#8b5cf6',
  todo: '#3b82f6',
  backlog: '#6b7280',
};

const STATUS_LABELS = {
  done: 'Concluído',
  in_progress: 'Em Progresso',
  review: 'Revisão',
  todo: 'A Fazer',
  backlog: 'Backlog',
};

export default function GanttPage() {
  const { tasks } = useKanbanStore();

  const tasksWithDates = tasks.filter((t) => t.startDate || t.dueDate);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { timelineStart, timelineEnd: _timelineEnd, days } = useMemo(() => {
    if (tasksWithDates.length === 0) {
      const start = startOfDay(new Date());
      const end = addDays(start, 30);
      return { timelineStart: start, timelineEnd: end, days: 30 };
    }

    const dates: Date[] = [];
    tasksWithDates.forEach((t) => {
      if (t.startDate) dates.push(parseISO(t.startDate));
      if (t.dueDate) dates.push(parseISO(t.dueDate));
    });

    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    const start = addDays(startOfDay(min), -2);
    const end = addDays(startOfDay(max), 5);
    return { timelineStart: start, timelineEnd: end, days: differenceInDays(end, start) };
  }, [tasksWithDates]);

  const dayWidth = 36;
  const totalWidth = days * dayWidth;

  const dayColumns = Array.from({ length: days }, (_, i) => addDays(timelineStart, i));

  const today = startOfDay(new Date());
  const todayOffset = differenceInDays(today, timelineStart) * dayWidth;

  const getTaskBar = (task: typeof tasks[0]) => {
    const start = task.startDate ? parseISO(task.startDate) : parseISO(task.dueDate || task.createdAt);
    const end = task.dueDate ? parseISO(task.dueDate) : addDays(start, 1);
    const left = differenceInDays(start, timelineStart) * dayWidth;
    const width = Math.max(differenceInDays(end, start), 1) * dayWidth;
    const color = task.status === 'done'
      ? STATUS_COLORS.done
      : PRIORITY_COLORS[task.priority];
    const isOverdue = parseISO(task.dueDate || '') < today && task.status !== 'done';

    return { left, width, color, isOverdue };
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Gráfico Gantt" subtitle="Linha do tempo do projeto" />
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <BarChart2 size={64} className="text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-2">Nenhuma tarefa encontrada</h2>
            <p className="text-gray-600 text-sm">Adicione tarefas com datas ao seu projeto para visualizar o Gantt.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Gráfico Gantt" subtitle={`${tasksWithDates.length} tarefas com datas`} />

      <div className="flex-1 overflow-hidden flex flex-col p-6">
        {tasksWithDates.length === 0 && (
          <div className="card p-4 mb-4 flex items-center gap-3 border-yellow-500/30 bg-yellow-500/5">
            <AlertTriangle size={18} className="text-yellow-400" />
            <p className="text-sm text-yellow-300">
              Nenhuma tarefa possui datas definidas. Adicione datas de início e entrega nas tarefas para visualizar no Gantt.
            </p>
          </div>
        )}

        <div className="card flex-1 overflow-auto">
          <div className="flex min-w-max">
            {/* Left panel: task names */}
            <div className="w-64 flex-shrink-0 sticky left-0 bg-gray-900 z-10 border-r border-gray-800">
              {/* Header */}
              <div className="h-12 flex items-center px-4 border-b border-gray-800 bg-gray-900">
                <span className="text-sm font-semibold text-gray-400">Tarefa</span>
              </div>

              {/* Task rows */}
              {tasksWithDates.map((task) => (
                <div key={task.id} className="h-12 flex items-center px-4 border-b border-gray-800/50 hover:bg-gray-800/30">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[task.status] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">{STATUS_LABELS[task.status]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right panel: timeline */}
            <div className="flex-1 overflow-x-auto">
              {/* Day headers */}
              <div className="h-12 flex border-b border-gray-800 bg-gray-900 sticky top-0 z-10" style={{ width: totalWidth }}>
                {dayColumns.map((day, i) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isTodayCol = differenceInDays(day, today) === 0;
                  return (
                    <div
                      key={i}
                      className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-800/50 text-xs ${
                        isWeekend ? 'bg-gray-800/30' : ''
                      } ${isTodayCol ? 'bg-indigo-500/10' : ''}`}
                      style={{ width: dayWidth }}
                    >
                      <span className={`font-medium ${isTodayCol ? 'text-indigo-400' : 'text-gray-500'}`}>
                        {format(day, 'd')}
                      </span>
                      <span className="text-gray-600 text-xs">
                        {format(day, 'MMM', { locale: ptBR })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Task bars */}
              <div className="relative" style={{ width: totalWidth }}>
                {/* Today line */}
                {todayOffset >= 0 && todayOffset <= totalWidth && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 z-10"
                    style={{ left: todayOffset }}
                  >
                    <div className="absolute -top-0 left-1 text-xs text-indigo-400 whitespace-nowrap">Hoje</div>
                  </div>
                )}

                {/* Weekend backgrounds */}
                {dayColumns.map((day, i) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return isWeekend ? (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 bg-gray-800/20"
                      style={{ left: i * dayWidth, width: dayWidth }}
                    />
                  ) : null;
                })}

                {tasksWithDates.map((task) => {
                  const { left, width, color, isOverdue } = getTaskBar(task);
                  const progress = task.checklist.length > 0
                    ? (task.checklist.filter((c) => c.completed).length / task.checklist.length) * 100
                    : task.status === 'done' ? 100 : 0;

                  return (
                    <div key={task.id} className="h-12 flex items-center relative border-b border-gray-800/30">
                      <div
                        className={`absolute h-6 rounded-full overflow-hidden ${isOverdue ? 'ring-1 ring-red-400' : ''}`}
                        style={{ left, width: Math.max(width, dayWidth), backgroundColor: color + '30', border: `1px solid ${color}60` }}
                        title={`${task.title} | ${task.startDate || ''} → ${task.dueDate || ''}`}
                      >
                        {/* Progress fill */}
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: color + '80' }}
                        />
                        {/* Label */}
                        <span
                          className="absolute inset-0 flex items-center px-2 text-xs font-medium truncate"
                          style={{ color }}
                        >
                          {task.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }} />
              {label}
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-indigo-400">
            <div className="w-0.5 h-4 bg-indigo-500" />
            Hoje
          </div>
        </div>
      </div>
    </div>
  );
}

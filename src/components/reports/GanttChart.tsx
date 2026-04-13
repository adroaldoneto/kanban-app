import { useMemo, useRef, useState } from 'react';
import { useKanban } from '../../contexts/KanbanContext';
import { parseISO, differenceInDays, format, addDays, startOfDay, isValid, min, max } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PRIORITY_CONFIG, COLUMNS } from '../../types';
import type { KanbanTask } from '../../types';
import { Download, ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function GanttChart() {
  const { tasks, currentProject } = useKanban();
  const chartRef = useRef<HTMLDivElement>(null);
  const [dayWidth, setDayWidth] = useState(32);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const ganttData = useMemo(() => {
    if (!tasks.length) return { tasks: [], startDate: new Date(), endDate: new Date(), totalDays: 0 };

    const validTasks = tasks.filter((t) => {
      try {
        const s = parseISO(t.startDate);
        const e = parseISO(t.dueDate);
        return isValid(s) && isValid(e);
      } catch { return false; }
    });

    if (!validTasks.length) return { tasks: [], startDate: new Date(), endDate: new Date(), totalDays: 0 };

    const allStarts = validTasks.map((t) => parseISO(t.startDate));
    const allEnds = validTasks.map((t) => parseISO(t.dueDate));
    const chartStart = startOfDay(addDays(min(allStarts), -2));
    const chartEnd = startOfDay(addDays(max(allEnds), 3));
    const totalDays = differenceInDays(chartEnd, chartStart) + 1;

    const sortedTasks = [...validTasks].sort((a, b) => {
      const colOrder = COLUMNS.findIndex((c) => c.id === a.columnId) - COLUMNS.findIndex((c) => c.id === b.columnId);
      if (colOrder !== 0) return colOrder;
      return parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime();
    });

    return { tasks: sortedTasks, startDate: chartStart, endDate: chartEnd, totalDays };
  }, [tasks]);

  function getBarPosition(task: KanbanTask) {
    const start = parseISO(task.startDate);
    const end = parseISO(task.dueDate);
    const left = differenceInDays(start, ganttData.startDate) * dayWidth;
    const width = Math.max((differenceInDays(end, start) + 1) * dayWidth, dayWidth);
    return { left, width };
  }

  function getBarColor(task: KanbanTask): string {
    const col = COLUMNS.find((c) => c.id === task.columnId);
    if (task.columnId === 'done') return '#22c55e';
    if (task.priority === 'urgent') return '#ef4444';
    if (task.priority === 'high') return '#f59e0b';
    return col?.color || '#3b82f6';
  }

  function getProgress(task: KanbanTask): number {
    switch (task.columnId) {
      case 'backlog': return 0;
      case 'todo': return 10;
      case 'in_progress': return 50;
      case 'review': return 80;
      case 'done': return 100;
      default: return 0;
    }
  }

  async function exportToPDF() {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`gantt-${currentProject?.name || 'projeto'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  async function exportToImage() {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `gantt-${currentProject?.name || 'projeto'}-${format(new Date(), 'yyyy-MM-dd')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  const dayHeaders = useMemo(() => {
    const headers = [];
    for (let i = 0; i < ganttData.totalDays; i++) {
      const date = addDays(ganttData.startDate, i);
      headers.push(date);
    }
    return headers;
  }, [ganttData]);

  const todayOffset = differenceInDays(startOfDay(new Date()), ganttData.startDate);

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Selecione um projeto</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Gráfico Gantt
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{currentProject.name} — Visão temporal do projeto</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDayWidth(Math.max(16, dayWidth - 4))} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 w-10 text-center">{dayWidth}px</span>
          <button onClick={() => setDayWidth(Math.min(64, dayWidth + 4))} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button onClick={exportToImage} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition">
            <Download className="w-4 h-4" /> PNG
          </button>
          <button onClick={exportToPDF} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition shadow-md shadow-blue-500/20">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white" ref={chartRef}>
        {ganttData.tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma tarefa com datas definidas</p>
            </div>
          </div>
        ) : (
          <div className="min-w-max">
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 flex">
              <div className="w-72 flex-shrink-0 px-4 py-3 bg-gray-50 border-r border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarefa</span>
              </div>
              <div className="flex">
                {dayHeaders.map((date, i) => {
                  const isToday = i === todayOffset;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={`flex-shrink-0 text-center border-r border-gray-100 py-2 ${
                        isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50/50' : ''
                      }`}
                      style={{ width: dayWidth }}
                    >
                      <div className="text-[10px] text-gray-400 leading-none">
                        {format(date, 'EEE', { locale: ptBR })}
                      </div>
                      <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                        {format(date, 'dd')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {ganttData.tasks.map((task) => {
              const { left, width } = getBarPosition(task);
              const color = getBarColor(task);
              const progress = getProgress(task);
              const isHovered = hoveredTask === task.id;

              return (
                <div
                  key={task.id}
                  className={`flex border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${isHovered ? 'bg-blue-50/30' : ''}`}
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                >
                  <div className="w-72 flex-shrink-0 px-4 py-3 border-r border-gray-100 flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PRIORITY_CONFIG[task.priority].color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      <p className="text-xs text-gray-400 truncate">{task.assignee}</p>
                    </div>
                  </div>
                  <div className="relative flex-1" style={{ height: 48 }}>
                    {dayHeaders.map((date, i) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday = i === todayOffset;
                      return (
                        <div
                          key={i}
                          className={`absolute top-0 bottom-0 border-r border-gray-50 ${
                            isToday ? 'bg-blue-50/50' : isWeekend ? 'bg-gray-50/30' : ''
                          }`}
                          style={{ left: i * dayWidth, width: dayWidth }}
                        />
                      );
                    })}
                    {todayOffset >= 0 && todayOffset < ganttData.totalDays && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                        style={{ left: todayOffset * dayWidth + dayWidth / 2 }}
                      />
                    )}
                    <div
                      className="absolute top-2.5 rounded-lg overflow-hidden shadow-sm transition-all"
                      style={{ left, width, height: 24 }}
                    >
                      <div
                        className="h-full rounded-lg opacity-25"
                        style={{ backgroundColor: color }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg"
                        style={{ width: `${progress}%`, backgroundColor: color }}
                      />
                      {width > 60 && (
                        <span
                          className="absolute inset-0 flex items-center px-2 text-xs font-medium truncate"
                          style={{ color: progress > 50 ? '#fff' : color }}
                        >
                          {progress}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="px-4 py-3 flex items-center gap-6 border-t border-gray-200 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Legenda:</span>
              {COLUMNS.map((col) => (
                <span key={col.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: col.color }} />
                  {col.title}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-3 h-0.5 bg-red-400" />
                Hoje
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

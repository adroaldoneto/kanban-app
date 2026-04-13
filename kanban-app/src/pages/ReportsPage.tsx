import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FileDown, Camera, CheckCircle2, Clock, AlertTriangle, TrendingUp, Download } from 'lucide-react';
import { useKanbanStore } from '../stores/kanbanStore';
import { useScheduleStore } from '../stores/scheduleStore';
import { generateDailyPDF, downloadBlob, captureElementAsImage, downloadDataURL } from '../utils/reportGenerator';
import Header from '../components/layout/Header';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const STATUS_COLORS = {
  done: '#10b981',
  in_progress: '#f59e0b',
  review: '#8b5cf6',
  todo: '#3b82f6',
  backlog: '#6b7280',
};

export default function ReportsPage() {
  const { tasks, activeProject } = useKanbanStore();
  const { shifts } = useScheduleStore();
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [generating, setGenerating] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const todayShifts = shifts.filter((s) => s.date === reportDate);

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    review: tasks.filter((t) => t.status === 'review').length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    backlog: tasks.filter((t) => t.status === 'backlog').length,
    overdue: tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length,
    totalHours: tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0),
    completionRate: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0,
  };

  const statusData = [
    { name: 'Backlog', value: stats.backlog, color: STATUS_COLORS.backlog },
    { name: 'A Fazer', value: stats.todo, color: STATUS_COLORS.todo },
    { name: 'Em Progresso', value: stats.inProgress, color: STATUS_COLORS.in_progress },
    { name: 'Revisão', value: stats.review, color: STATUS_COLORS.review },
    { name: 'Concluído', value: stats.done, color: STATUS_COLORS.done },
  ].filter((d) => d.value > 0);

  const priorityData = [
    { name: 'Urgente', value: tasks.filter((t) => t.priority === 'urgent').length, color: PRIORITY_COLORS.urgent },
    { name: 'Alta', value: tasks.filter((t) => t.priority === 'high').length, color: PRIORITY_COLORS.high },
    { name: 'Média', value: tasks.filter((t) => t.priority === 'medium').length, color: PRIORITY_COLORS.medium },
    { name: 'Baixa', value: tasks.filter((t) => t.priority === 'low').length, color: PRIORITY_COLORS.low },
  ].filter((d) => d.value > 0);

  const handleGeneratePDF = async () => {
    if (!activeProject) return toast.error('Selecione um projeto.');
    setGenerating(true);
    try {
      const blob = await generateDailyPDF({
        project: activeProject,
        tasks,
        shifts: todayShifts,
        date: new Date(reportDate + 'T12:00'),
      });
      const filename = `kanflow-relatorio-${reportDate}.pdf`;
      downloadBlob(blob, filename);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar PDF.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCaptureImage = async () => {
    setCapturing(true);
    try {
      const dataUrl = await captureElementAsImage('report-panel');
      downloadDataURL(dataUrl, `kanflow-relatorio-${reportDate}.png`);
      toast.success('Imagem salva!');
    } catch {
      toast.error('Erro ao capturar imagem.');
    } finally {
      setCapturing(false);
    }
  };

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' },
    labelStyle: { color: '#e5e7eb' },
    itemStyle: { color: '#9ca3af' },
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Relatórios" subtitle="Análise completa do projeto" />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900/30">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Data do relatório:</label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="input text-sm w-auto"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCaptureImage}
            disabled={capturing}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Camera size={16} />
            {capturing ? 'Capturando...' : 'Salvar como Imagem'}
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={generating}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <FileDown size={16} />
            {generating ? 'Gerando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Report panel */}
      <div id="report-panel" className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Date header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-100">
              {activeProject?.name || 'Projeto'}
            </h2>
            <p className="text-sm text-gray-500">
              {format(new Date(reportDate + 'T12:00'), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Download size={14} />
            Relatório Diário
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total de Tarefas', value: stats.total, icon: TrendingUp, color: 'indigo', extra: '' },
            { label: 'Concluídas', value: stats.done, icon: CheckCircle2, color: 'green', extra: `${stats.completionRate}%` },
            { label: 'Em Progresso', value: stats.inProgress, icon: Clock, color: 'yellow', extra: '' },
            { label: 'Atrasadas', value: stats.overdue, icon: AlertTriangle, color: 'red', extra: '' },
          ].map(({ label, value, icon: Icon, color, extra }) => (
            <div key={label} className={`card p-4 border-${color}-500/20`}>
              <div className={`w-9 h-9 bg-${color}-500/10 rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} className={`text-${color}-400`} />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-gray-100">{value}</p>
                {extra && <p className="text-sm text-gray-500 mb-1">{extra}</p>}
              </div>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Completion progress */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-200">Taxa de Conclusão Geral</h3>
            <span className="text-2xl font-bold gradient-text">{stats.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-700"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{stats.done} concluídas</span>
            <span>{stats.total - stats.done} pendentes</span>
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Status distribution */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-200 mb-4">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3}>
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend formatter={(v) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Priority distribution */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-200 mb-4">Tarefas por Prioridade</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" name="Tarefas" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hours estimation */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-200 mb-4">Horas Estimadas por Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(STATUS_COLORS).map(([status, color]) => {
              const hours = tasks
                .filter((t) => t.status === status)
                .reduce((s, t) => s + (t.estimatedHours || 0), 0);
              const labels: Record<string, string> = { done: 'Concluído', in_progress: 'Em Progresso', review: 'Revisão', todo: 'A Fazer', backlog: 'Backlog' };
              return (
                <div key={status} className="card p-3 text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: color }} />
                  <p className="text-xl font-bold text-gray-200">{hours}h</p>
                  <p className="text-xs text-gray-500">{labels[status]}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's shifts */}
        {todayShifts.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-200 mb-4">
              Escalas do Dia — {format(new Date(reportDate + 'T12:00'), "dd/MM/yyyy")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayShifts.map((shift) => (
                <div key={shift.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-200 text-sm">{shift.userName}</span>
                    <span className="text-xs text-gray-500">{shift.startTime}–{shift.endTime}</span>
                  </div>
                  <p className="text-xs text-gray-500">{shift.role}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                    shift.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                    shift.status === 'completed' ? 'bg-gray-500/20 text-gray-300' :
                    shift.status === 'absent' ? 'bg-red-500/20 text-red-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {shift.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks table */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-200 mb-4">Lista de Tarefas ({tasks.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Título</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Prioridade</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Entrega</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Horas</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                  return (
                    <tr key={task.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2.5 px-3 text-gray-200 max-w-xs truncate">{task.title}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: STATUS_COLORS[task.status] + '20',
                            color: STATUS_COLORS[task.status],
                          }}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: PRIORITY_COLORS[task.priority] + '20',
                            color: PRIORITY_COLORS[task.priority],
                          }}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                        {task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy') : '-'}
                        {isOverdue && ' ⚠️'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs">{task.estimatedHours ? `${task.estimatedHours}h` : '-'}</td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs">{task.assigneeName || '-'}</td>
                    </tr>
                  );
                })}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-600">Nenhuma tarefa encontrada</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

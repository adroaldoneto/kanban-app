import { useState, useMemo, useRef } from 'react';
import { useKanban } from '../../contexts/KanbanContext';
import {
  FileText, Download, Mail, Image,
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Users, BarChart3, PieChart,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { format, parseISO, isValid, startOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { COLUMNS, PRIORITY_CONFIG } from '../../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { sendReportByEmail, isEmailConfigured } from '../../services/emailService';

export default function ReportsPage() {
  const { tasks, currentProject } = useKanban();
  const reportRef = useRef<HTMLDivElement>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const stats = useMemo(() => {
    if (!tasks.length) return null;

    const byColumn: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byAssignee: Record<string, { total: number; done: number }> = {};
    let totalHours = 0;
    let overdue = 0;
    const today = startOfDay(new Date());

    tasks.forEach((t) => {
      byColumn[t.columnId] = (byColumn[t.columnId] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;

      if (t.assignee) {
        if (!byAssignee[t.assignee]) byAssignee[t.assignee] = { total: 0, done: 0 };
        byAssignee[t.assignee].total++;
        if (t.columnId === 'done') byAssignee[t.assignee].done++;
      }

      if (t.estimatedHours) totalHours += t.estimatedHours;

      try {
        const due = parseISO(t.dueDate);
        if (isValid(due) && due < today && t.columnId !== 'done') overdue++;
      } catch {}
    });

    const columnChartData = COLUMNS.map((col) => ({
      name: col.title,
      value: byColumn[col.id] || 0,
      color: col.color,
    }));

    const priorityChartData = Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => ({
      name: cfg.label,
      value: byPriority[key] || 0,
      color: cfg.color,
    }));

    const assigneeChartData = Object.entries(byAssignee).map(([name, data]) => ({
      name,
      total: data.total,
      concluídas: data.done,
      pendentes: data.total - data.done,
    }));

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const completed = tasks.filter((t) => {
        if (!t.completedAt) return false;
        try {
          return format(parseISO(t.completedAt), 'yyyy-MM-dd') === dayStr;
        } catch { return false; }
      }).length;
      return { name: format(day, 'EEE', { locale: ptBR }), date: format(day, 'dd/MM'), completed };
    });

    const done = byColumn['done'] || 0;
    const total = tasks.length;

    return {
      total, done, overdue, totalHours,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      columnChartData, priorityChartData, assigneeChartData, last7Days,
      byColumn,
    };
  }, [tasks]);

  async function exportToPDF() {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text('Relatório Diário - Kanban Pro', 14, 18);
    pdf.setFontSize(11);
    pdf.text(`Projeto: ${currentProject?.name || 'N/A'}`, 14, 28);
    pdf.text(`Data: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 35);

    pdf.setTextColor(30, 41, 59);
    let y = 52;

    pdf.setFontSize(14);
    pdf.text('Resumo Geral', 14, y);
    y += 8;

    if (stats) {
      const summaryData = [
        ['Total de Tarefas', stats.total.toString()],
        ['Concluídas', stats.done.toString()],
        ['Progresso', `${stats.progress}%`],
        ['Atrasadas', stats.overdue.toString()],
        ['Horas Estimadas', `${stats.totalHours}h`],
      ];

      (pdf as any).autoTable({
        startY: y,
        head: [['Métrica', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold' } },
      });

      y = (pdf as any).lastAutoTable.finalY + 12;

      pdf.setFontSize(14);
      pdf.text('Tarefas por Status', 14, y);
      y += 8;

      const statusData = COLUMNS.map((col) => [
        col.title,
        (stats.byColumn[col.id] || 0).toString(),
      ]);

      (pdf as any).autoTable({
        startY: y,
        head: [['Status', 'Quantidade']],
        body: statusData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      y = (pdf as any).lastAutoTable.finalY + 12;

      if (y > 220) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Detalhamento de Tarefas', 14, y);
      y += 8;

      const taskRows = tasks.map((t) => [
        t.title.length > 30 ? t.title.slice(0, 30) + '...' : t.title,
        COLUMNS.find((c) => c.id === t.columnId)?.title || t.columnId,
        PRIORITY_CONFIG[t.priority].label,
        t.assignee || '-',
        t.dueDate ? format(parseISO(t.dueDate), 'dd/MM/yyyy') : '-',
      ]);

      (pdf as any).autoTable({
        startY: y,
        head: [['Tarefa', 'Status', 'Prioridade', 'Responsável', 'Prazo']],
        body: taskRows,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 55 } },
      });
    }

    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Kanban Pro - Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Página ${i} de ${pageCount}`,
        pageWidth / 2, pdf.internal.pageSize.getHeight() - 8, { align: 'center' }
      );
    }

    pdf.save(`relatorio-${currentProject?.name || 'projeto'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  async function exportToImage() {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `relatorio-${currentProject?.name || 'projeto'}-${format(new Date(), 'yyyy-MM-dd')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function handleSendEmail() {
    if (!emailTo.trim()) return;
    setEmailSending(true);
    setEmailError('');
    setEmailSuccess(false);

    try {
      const reportHtml = generateEmailHtml();
      await sendReportByEmail({
        toEmail: emailTo.trim(),
        toName: emailTo.split('@')[0],
        subject: `Relatório Diário - ${currentProject?.name || 'Projeto'} - ${format(new Date(), 'dd/MM/yyyy')}`,
        reportHtml,
        reportDate: format(new Date(), 'dd/MM/yyyy'),
        projectName: currentProject?.name || 'Projeto',
      });
      setEmailSuccess(true);
      setTimeout(() => { setShowEmailModal(false); setEmailSuccess(false); }, 2000);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Erro ao enviar email');
    } finally {
      setEmailSending(false);
    }
  }

  function generateEmailHtml(): string {
    if (!stats) return '<p>Nenhum dado disponível.</p>';
    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2563eb;color:#fff;padding:20px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;">Relatório Diário - Kanban Pro</h1>
          <p style="margin:5px 0 0;opacity:0.8;">Projeto: ${currentProject?.name} | ${format(new Date(), 'dd/MM/yyyy')}</p>
        </div>
        <div style="padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;">Total de Tarefas</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${stats.total}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;">Concluídas</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#22c55e;">${stats.done}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;">Progresso</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${stats.progress}%</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;">Atrasadas</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#ef4444;">${stats.overdue}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Horas Estimadas</td><td style="padding:8px;">${stats.totalHours}h</td></tr>
          </table>
          <div style="margin-top:16px;">
            <h3 style="font-size:14px;color:#475569;">Status das Tarefas</h3>
            ${stats.columnChartData.map((d) => `
              <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
                <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${d.color};"></span>
                <span>${d.name}: <strong>${d.value}</strong></span>
              </div>
            `).join('')}
          </div>
          <p style="margin-top:20px;color:#94a3b8;font-size:12px;">Gerado por Kanban Pro em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
        </div>
      </div>
    `;
  }

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Selecione um projeto para ver os relatórios</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Relatórios
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{currentProject.name} — Relatório diário e métricas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportToImage} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition">
            <Image className="w-4 h-4" /> Foto
          </button>
          <button onClick={exportToPDF} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm hover:bg-red-100 transition">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition shadow-md shadow-blue-500/20">
            <Mail className="w-4 h-4" /> Enviar por Email
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6" ref={reportRef}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Relatório Diário</h3>
              <p className="text-blue-200 text-sm">
                {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats?.progress || 0}%</div>
              <div className="text-blue-200 text-sm">Progresso geral</div>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-white transition-all duration-700"
              style={{ width: `${stats?.progress || 0}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total de Tarefas', value: stats?.total || 0, icon: BarChart3, color: 'blue', bg: 'bg-blue-50', iconBg: 'bg-blue-100', textColor: 'text-blue-600' },
            { label: 'Concluídas', value: stats?.done || 0, icon: CheckCircle2, color: 'green', bg: 'bg-green-50', iconBg: 'bg-green-100', textColor: 'text-green-600' },
            { label: 'Horas Estimadas', value: `${stats?.totalHours || 0}h`, icon: Clock, color: 'purple', bg: 'bg-purple-50', iconBg: 'bg-purple-100', textColor: 'text-purple-600' },
            { label: 'Atrasadas', value: stats?.overdue || 0, icon: AlertTriangle, color: 'red', bg: 'bg-red-50', iconBg: 'bg-red-100', textColor: 'text-red-600' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`${item.bg} rounded-2xl p-5`}>
                <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${item.textColor}`} />
                </div>
                <div className={`text-2xl font-bold ${item.textColor}`}>{item.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{item.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-500" /> Tarefas por Status
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPieChart>
                <Pie
                  data={stats?.columnChartData || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats?.columnChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" /> Tarefas por Prioridade
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats?.priorityChartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Tarefas">
                  {stats?.priorityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" /> Tarefas por Responsável
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats?.assigneeChartData || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="concluídas" fill="#22c55e" radius={[0, 4, 4, 0]} name="Concluídas" stackId="a" />
                <Bar dataKey="pendentes" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Pendentes" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Tarefas concluídas (7 dias)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats?.last7Days || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="completed" stroke="#3b82f6" fill="url(#areaGrad)" strokeWidth={2} name="Concluídas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Detalhamento de Tarefas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Tarefa</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Prioridade</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Responsável</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Prazo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Horas</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const col = COLUMNS.find((c) => c.id === task.columnId);
                  const pri = PRIORITY_CONFIG[task.priority];
                  return (
                    <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-800">{task.title}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col?.color }} />
                          {col?.title}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: pri.bgColor, color: pri.color }}>
                          {pri.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{task.assignee || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {task.dueDate ? format(parseISO(task.dueDate), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{task.estimatedHours ? `${task.estimatedHours}h` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pb-4">
          Relatório gerado por Kanban Pro em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEmailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" /> Enviar Relatório por Email
            </h3>

            {!isEmailConfigured() && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                <p className="font-medium">Configuração necessária</p>
                <p className="mt-1">Configure as variáveis de ambiente do EmailJS:</p>
                <ul className="mt-1 text-xs space-y-0.5 list-disc list-inside">
                  <li>VITE_EMAILJS_SERVICE_ID</li>
                  <li>VITE_EMAILJS_REPORT_TEMPLATE_ID</li>
                  <li>VITE_EMAILJS_PUBLIC_KEY</li>
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email do destinatário</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="destinatario@email.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                />
              </div>

              {emailError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{emailError}</div>
              )}

              {emailSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                  Email enviado com sucesso!
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending || !emailTo.trim()}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {emailSending ? (
                    <>Enviando...</>
                  ) : (
                    <><Mail className="w-4 h-4" /> Enviar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

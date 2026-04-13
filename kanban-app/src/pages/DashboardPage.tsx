import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, ArrowRight, Kanban, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useKanbanStore } from '../stores/kanbanStore';
import { useAuthStore } from '../stores/authStore';
import Header from '../components/layout/Header';

const STATUS_COLORS = {
  backlog: '#6b7280',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  review: '#8b5cf6',
  done: '#10b981',
};

const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  review: 'Revisão',
  done: 'Concluído',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { tasks, projects, activeProject, subscribeBoard, subscribeProjects } = useKanbanStore();

  useEffect(() => {
    if (user) subscribeProjects(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    if (activeProject) subscribeBoard(activeProject.id);
  }, [activeProject?.id]);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  ).length;

  const statusData = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: tasks.filter((t) => t.status === key).length,
    color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
  })).filter((d) => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      day: format(date, 'EEE', { locale: ptBR }),
      completed: tasks.filter(
        (t) => t.status === 'done' && t.updatedAt?.startsWith(dateStr)
      ).length,
      created: tasks.filter((t) => t.createdAt?.startsWith(dateStr)).length,
    };
  });


  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const stats = [
    { label: 'Total de Tarefas', value: totalTasks, icon: Kanban, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Concluídas', value: doneTasks, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Em Progresso', value: inProgressTasks, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Atrasadas', value: overdueTasks, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle={`Bem-vindo, ${user?.displayName}!`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={20} className={color} />
                </div>
                <TrendingUp size={14} className="text-gray-600" />
              </div>
              <p className="text-3xl font-bold text-gray-100">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Completion rate */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-200">Taxa de Conclusão</h3>
            <span className="text-2xl font-bold text-indigo-400">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{doneTasks} de {totalTasks} tarefas concluídas</p>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Activity chart */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-200 mb-4">Atividade (últimos 7 dias)</h3>
            {tasks.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                    labelStyle={{ color: '#e5e7eb' }}
                    itemStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="created" name="Criadas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Concluídas" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                Nenhuma atividade ainda
              </div>
            )}
          </div>

          {/* Status pie */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-200 mb-4">Tarefas por Status</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                    itemStyle={{ color: '#9ca3af' }}
                  />
                  <Legend
                    formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                Nenhuma tarefa ainda
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/kanban" className="card p-5 hover:border-indigo-500/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Kanban size={20} className="text-indigo-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-200">Abrir Kanban</p>
                  <p className="text-sm text-gray-500">Gerenciar tarefas</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
            </div>
          </Link>

          <Link to="/schedule" className="card p-5 hover:border-indigo-500/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Calendar size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-200">Ver Escalas</p>
                  <p className="text-sm text-gray-500">Gerenciar turnos</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Projects list */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Users size={18} />
            Projetos
          </h3>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-200">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-gray-500">{project.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {tasks.filter((t) => t.projectId === project.id).length} tarefas
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Nenhum projeto criado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

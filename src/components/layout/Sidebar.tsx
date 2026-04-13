import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useKanban } from '../../contexts/KanbanContext';
import {
  Kanban, LayoutDashboard, BarChart3, FileText, Settings,
  LogOut, Plus, ChevronDown, FolderOpen, Menu, X,
} from 'lucide-react';
import { getInitials } from '../../utils/helpers';
import type { Project } from '../../types';
import { PROJECT_COLORS } from '../../types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { userProfile, logout, isDemo } = useAuth();
  const { projects, currentProject, setCurrentProject, addProject } = useKanban();
  const [showProjects, setShowProjects] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'board', label: 'Quadro Kanban', icon: LayoutDashboard },
    { id: 'gantt', label: 'Gráfico Gantt', icon: BarChart3 },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  async function handleAddProject() {
    if (!newProjectName.trim()) return;
    await addProject({
      name: newProjectName.trim(),
      description: '',
      ownerId: userProfile?.uid || 'demo',
      members: [],
      color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
    });
    setNewProjectName('');
    setShowNewProject(false);
  }

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-200"
      >
        {collapsed ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${
          collapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Kanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">Kanban Pro</h1>
              <span className="text-xs text-gray-400">Gestão de Projetos</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { onViewChange(item.id); setCollapsed(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-4">
            <button
              onClick={() => setShowProjects(!showProjects)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              <span className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" /> Projetos
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showProjects ? '' : '-rotate-90'}`} />
            </button>

            {showProjects && (
              <div className="space-y-0.5 mt-1">
                {projects.map((project: Project) => (
                  <button
                    key={project.id}
                    onClick={() => { setCurrentProject(project); onViewChange('board'); setCollapsed(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      currentProject?.id === project.id
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </button>
                ))}

                {showNewProject ? (
                  <div className="px-3 py-2 space-y-2">
                    <input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                      placeholder="Nome do projeto"
                      autoFocus
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleAddProject} className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                        Criar
                      </button>
                      <button onClick={() => setShowNewProject(false)} className="flex-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" /> Novo projeto
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {getInitials(userProfile?.displayName || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userProfile?.displayName}</p>
              <p className="text-xs text-gray-400 truncate">{isDemo ? 'Modo Demo' : userProfile?.email}</p>
            </div>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  BarChart3,
  FileText,
  Mail,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderKanban,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useKanbanStore } from '../../stores/kanbanStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/kanban', icon: Kanban, label: 'Kanban' },
  { path: '/schedule', icon: Calendar, label: 'Escalas' },
  { path: '/gantt', icon: BarChart3, label: 'Gantt' },
  { path: '/reports', icon: FileText, label: 'Relatórios' },
  { path: '/email', icon: Mail, label: 'E-mail' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { projects, activeProject, setActiveProject, createProject } = useKanbanStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showProjects, setShowProjects] = useState(true);

  const handleNewProject = async () => {
    if (!user) return;
    const name = prompt('Nome do projeto:');
    if (!name) return;
    const id = await createProject(
      { name, description: '', color: '#6366f1' },
      user.uid
    );
    const newProject = projects.find((p) => p.id === id);
    if (newProject) setActiveProject(newProject);
  };

  return (
    <aside
      className={`relative flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <FolderKanban size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg gradient-text truncate">KanFlow</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                  title={collapsed ? label : ''}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Projects */}
        {!collapsed && (
          <div className="mt-6 px-2">
            <button
              onClick={() => setShowProjects(!showProjects)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300"
            >
              <span>Projetos</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewProject();
                }}
                className="p-0.5 hover:bg-gray-700 rounded"
              >
                <Plus size={14} />
              </button>
            </button>

            {showProjects && (
              <ul className="mt-1 space-y-1">
                {projects.map((project) => (
                  <li key={project.id}>
                    <button
                      onClick={() => setActiveProject(project)}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeProject?.id === project.id
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color || '#6366f1' }}
                      />
                      <span className="truncate">{project.name}</span>
                    </button>
                  </li>
                ))}
                {projects.length === 0 && (
                  <li className="px-3 py-2 text-xs text-gray-600">
                    Nenhum projeto ainda
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-800 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
            <div className="flex items-center gap-1">
              <Link to="/settings" className="p-1.5 text-gray-500 hover:text-gray-300 rounded">
                <Settings size={16} />
              </Link>
              <button
                onClick={logout}
                className="p-1.5 text-gray-500 hover:text-red-400 rounded"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={logout} className="w-full flex justify-center p-1.5 text-gray-500 hover:text-red-400">
            <LogOut size={18} />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}

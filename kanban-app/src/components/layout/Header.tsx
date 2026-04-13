import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useKanbanStore } from '../../stores/kanbanStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuthStore();
  const { activeProject } = useKanbanStore();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div>
        <h1 className="text-xl font-bold text-gray-100">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">
            {activeProject ? `${activeProject.name} · ` : ''}{subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>

        <button className="relative p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold cursor-pointer">
          {user?.displayName?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

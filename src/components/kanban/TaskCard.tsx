import { useState } from 'react';
import { Calendar, Clock, MoreVertical, Trash2, Edit2, GripVertical } from 'lucide-react';
import { formatDate, getDueDateColor, getInitials, daysUntil } from '../../utils/helpers';
import { PRIORITY_CONFIG } from '../../types';
import type { KanbanTask } from '../../types';

interface TaskCardProps {
  task: KanbanTask;
  onEdit: (task: KanbanTask) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

export default function TaskCard({ task, onEdit, onDelete, isDragging }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const dueDays = daysUntil(task.dueDate);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400 rotate-2 scale-105' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: priorityConfig.bgColor, color: priorityConfig.color }}
          >
            {priorityConfig.label}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10 w-36">
              <button
                onClick={() => { onEdit(task); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="w-4 h-4" /> Editar
              </button>
              <button
                onClick={() => { onDelete(task.id); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 text-sm mb-1.5 leading-snug">{task.title}</h3>
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-xs">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md ${getDueDateColor(task.dueDate)}`}>
              <Calendar className="w-3 h-3" />
              {formatDate(task.dueDate)}
              {dueDays < 0 && <span className="font-medium">({Math.abs(dueDays)}d atraso)</span>}
            </span>
          )}
          {task.estimatedHours && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />{task.estimatedHours}h
            </span>
          )}
        </div>
        <div
          className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium"
          title={task.assignee}
        >
          {getInitials(task.assignee || '??')}
        </div>
      </div>
    </div>
  );
}

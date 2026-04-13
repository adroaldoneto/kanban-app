import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, CheckSquare, MessageSquare, AlertCircle, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { KanbanTask } from '../../types';

interface TaskCardProps {
  task: KanbanTask;
  onClick: () => void;
}

const priorityConfig = {
  urgent: { color: 'text-red-400 bg-red-400/10', label: 'Urgente', icon: AlertCircle },
  high: { color: 'text-orange-400 bg-orange-400/10', label: 'Alta', icon: ArrowUp },
  medium: { color: 'text-yellow-400 bg-yellow-400/10', label: 'Média', icon: Minus },
  low: { color: 'text-green-400 bg-green-400/10', label: 'Baixa', icon: ArrowDown },
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[task.priority];
  const PriorityIcon = priority.icon;
  const completedChecklist = task.checklist.filter((c) => c.completed).length;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`card p-3 cursor-pointer group hover:border-gray-600 transition-all duration-200 ${
        isDragging ? 'opacity-50 ring-2 ring-indigo-500 shadow-xl' : ''
      }`}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: label.color + '25', color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-gray-200 mb-2 line-clamp-2 group-hover:text-white">
        {task.title}
      </p>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Priority */}
      <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-2 ${priority.color}`}>
        <PriorityIcon size={11} />
        {priority.label}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {/* Due date */}
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
              <Calendar size={11} />
              {format(new Date(task.dueDate), 'dd/MM', { locale: ptBR })}
            </div>
          )}

          {/* Estimated hours */}
          {task.estimatedHours && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={11} />
              {task.estimatedHours}h
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Checklist */}
          {task.checklist.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CheckSquare size={11} />
              {completedChecklist}/{task.checklist.length}
            </div>
          )}

          {/* Comments */}
          {task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MessageSquare size={11} />
              {task.comments.length}
            </div>
          )}

          {/* Assignee avatar */}
          {task.assigneeName && (
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {task.assigneeName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

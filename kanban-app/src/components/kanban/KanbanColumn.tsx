import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';
import type { KanbanColumn as KanbanColumnType, KanbanTask } from '../../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: KanbanTask[];
  onTaskClick: (task: KanbanTask) => void;
  onAddTask: (columnId: string) => void;
}

export default function KanbanColumn({ column, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
          <span className="font-semibold text-sm text-gray-200">{column.title}</span>
          <span className="text-xs bg-gray-800 text-gray-500 rounded-full px-2 py-0.5 font-medium">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-48 rounded-xl p-2 transition-all duration-200 ${
          isOver ? 'bg-indigo-500/10 border-2 border-dashed border-indigo-500/50' : 'bg-gray-900/30 border-2 border-transparent'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-700">
            <p className="text-xs">Sem tarefas</p>
          </div>
        )}
      </div>

      {/* Add task */}
      <button
        onClick={() => onAddTask(column.id)}
        className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors w-full"
      >
        <Plus size={16} />
        Adicionar tarefa
      </button>
    </div>
  );
}

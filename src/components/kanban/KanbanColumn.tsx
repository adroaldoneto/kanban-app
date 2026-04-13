import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import type { KanbanColumn as KanbanColumnType, KanbanTask, ColumnId } from '../../types';

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: KanbanTask[];
  onAddTask: (columnId: ColumnId) => void;
  onEditTask: (task: KanbanTask) => void;
  onDeleteTask: (id: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: ColumnId) => void;
}

export default function KanbanColumn({
  column, tasks, onAddTask, onEditTask, onDeleteTask,
  onDragStart, onDragOver, onDrop,
}: KanbanColumnProps) {
  return (
    <div
      className="flex flex-col bg-gray-50/80 rounded-2xl min-w-[300px] max-w-[340px] flex-shrink-0"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-gray-800 text-sm">{column.title}</h3>
          <span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded-full text-xs font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-220px)] min-h-[120px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
          >
            <TaskCard
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-300">
            <p className="text-sm">Nenhuma tarefa</p>
          </div>
        )}
      </div>
    </div>
  );
}

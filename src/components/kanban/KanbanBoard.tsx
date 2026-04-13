import { useState, useCallback } from 'react';
import { useKanban } from '../../contexts/KanbanContext';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';
import { COLUMNS } from '../../types';
import type { KanbanTask, ColumnId } from '../../types';
import { Search, Filter, Users } from 'lucide-react';

export default function KanbanBoard() {
  const { tasks, getTasksByColumn, addTask, updateTask, deleteTask, moveTask, currentProject } = useKanban();
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<ColumnId | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filteredTasks = useCallback(
    (columnId: ColumnId) => {
      let colTasks = getTasksByColumn(columnId);
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        colTasks = colTasks.filter(
          (t) =>
            t.title.toLowerCase().includes(lower) ||
            t.assignee.toLowerCase().includes(lower) ||
            t.tags.some((tag) => tag.toLowerCase().includes(lower))
        );
      }
      if (filterPriority !== 'all') {
        colTasks = colTasks.filter((t) => t.priority === filterPriority);
      }
      return colTasks;
    },
    [getTasksByColumn, searchTerm, filterPriority]
  );

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: React.DragEvent, columnId: ColumnId) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const columnTasks = getTasksByColumn(columnId);
    moveTask(taskId, columnId, columnTasks.length);
  }

  function handleAddTask(columnId: ColumnId) {
    setEditingTask(null);
    setAddingToColumn(columnId);
    setShowModal(true);
  }

  function handleEditTask(task: KanbanTask) {
    setEditingTask(task);
    setAddingToColumn(null);
    setShowModal(true);
  }

  async function handleSaveTask(data: any) {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask(data);
    }
    setShowModal(false);
    setEditingTask(null);
    setAddingToColumn(null);
  }

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Nenhum projeto selecionado</h2>
          <p className="text-gray-400">Crie ou selecione um projeto na barra lateral</p>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.columnId === 'done').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentProject.color }} />
              {currentProject.name}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {totalTasks} tarefas &middot; {progress}% concluído
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar tarefas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition bg-white appearance-none"
            >
              <option value="all">Todas prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-5 h-full">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={filteredTasks(col.id)}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={deleteTask}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          columnId={addingToColumn || undefined}
          projectId={currentProject.id}
          onSave={handleSaveTask}
          onClose={() => { setShowModal(false); setEditingTask(null); setAddingToColumn(null); }}
        />
      )}
    </div>
  );
}

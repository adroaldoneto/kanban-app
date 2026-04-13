import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Filter, Plus, RefreshCw } from 'lucide-react';
import { useKanbanStore } from '../stores/kanbanStore';
import { useAuthStore } from '../stores/authStore';
import KanbanColumnComponent from '../components/kanban/KanbanColumn';
import TaskCard from '../components/kanban/TaskCard';
import TaskModal from '../components/kanban/TaskModal';
import Header from '../components/layout/Header';
import type { KanbanTask, TaskStatus } from '../types';

export default function KanbanPage() {
  const { user } = useAuthStore();
  const { columns, tasks, activeProject, subscribeBoard, createProject, setActiveProject, projects } = useKanbanStore();
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (!activeProject) return;
    const unsub = subscribeBoard(activeProject.id);
    return unsub;
  }, [activeProject?.id]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeTaskItem = tasks.find((t) => t.id === active.id);
    if (!activeTaskItem) return;

    const overColumn = columns.find((c) => c.id === over.id);
    const overTask = tasks.find((t) => t.id === over.id);
    const targetColumn = overColumn || columns.find((c) => c.id === overTask?.columnId);

    if (!targetColumn) return;

    const { moveTask } = useKanbanStore.getState();
    const targetTasks = tasks.filter((t) => t.columnId === targetColumn.id && t.id !== activeTaskItem.id);
    const newOrder = overTask ? targetTasks.findIndex((t) => t.id === overTask.id) : targetTasks.length;

    await moveTask(activeTaskItem.id, targetColumn.id, targetColumn.status as TaskStatus, newOrder);
  };

  const handleAddTask = (columnId: string) => {
    setSelectedTask(null);
    setNewTaskColumn(columnId);
    setShowModal(true);
  };

  const handleTaskClick = (task: KanbanTask) => {
    setSelectedTask(task);
    setNewTaskColumn(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTask(null);
    setNewTaskColumn(null);
  };

  const handleCreateProject = async () => {
    if (!user) return;
    const name = prompt('Nome do projeto:');
    if (!name) return;
    const id = await createProject({ name, description: '', color: '#6366f1' }, user.uid);
    const newProject = projects.find((p) => p.id === id) || { id, name, description: '', color: '#6366f1', ownerId: user.uid, members: [user.uid], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setActiveProject(newProject);
  };

  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.columnId === col.id)
      .filter((t) => filterPriority === 'all' || t.priority === filterPriority)
      .sort((a, b) => a.order - b.order),
  }));

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Nenhum projeto selecionado</h2>
        <p className="text-gray-500 mb-6">Crie um projeto para começar a usar o Kanban</p>
        <button onClick={handleCreateProject} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Criar projeto
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Kanban" subtitle={`${tasks.length} tarefas no total`} />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <Filter size={14} className="text-gray-500 ml-1" />
            {['all', 'urgent', 'high', 'medium', 'low'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  filterPriority === p ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {p === 'all' ? 'Todos' : p === 'urgent' ? 'Urgente' : p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => subscribeBoard(activeProject.id)}
          className="flex items-center gap-2 btn-secondary text-sm"
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-5 h-full items-start">
            {filteredColumns.map((col) => (
              <KanbanColumnComponent
                key={col.id}
                column={col}
                tasks={col.tasks}
                onTaskClick={handleTaskClick}
                onAddTask={handleAddTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="rotate-2 opacity-90">
                <TaskCard task={activeTask} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {showModal && (
        <TaskModal
          task={selectedTask}
          columnId={newTaskColumn || undefined}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

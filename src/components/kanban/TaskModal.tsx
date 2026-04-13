import { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, Clock, AlignLeft, Flag } from 'lucide-react';
import type { KanbanTask, ColumnId, Priority } from '../../types';
import { COLUMNS, PRIORITY_CONFIG } from '../../types';

interface TaskModalProps {
  task?: KanbanTask | null;
  columnId?: ColumnId;
  projectId: string;
  onSave: (task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt' | 'order'> | Partial<KanbanTask>) => void;
  onClose: () => void;
}

export default function TaskModal({ task, columnId, projectId, onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignee, setAssignee] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<ColumnId>(columnId || 'todo');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setAssignee(task.assignee);
      setAssigneeEmail(task.assigneeEmail);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setStartDate(task.startDate ? task.startDate.split('T')[0] : '');
      setTagsInput(task.tags.join(', '));
      setEstimatedHours(task.estimatedHours?.toString() || '');
      setSelectedColumn(task.columnId);
    }
  }, [task]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    if (task) {
      onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        assignee: assignee.trim(),
        assigneeEmail: assigneeEmail.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : '',
        startDate: startDate ? new Date(startDate).toISOString() : '',
        tags,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        columnId: selectedColumn,
      });
    } else {
      onSave({
        title: title.trim(),
        description: description.trim(),
        columnId: selectedColumn,
        priority,
        assignee: assignee.trim(),
        assigneeEmail: assigneeEmail.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        tags,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        projectId,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <AlignLeft className="w-4 h-4" /> Título
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              placeholder="Título da tarefa"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <AlignLeft className="w-4 h-4" /> Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition resize-none"
              placeholder="Descreva a tarefa..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Flag className="w-4 h-4" /> Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition bg-white"
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                Coluna
              </label>
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value as ColumnId)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition bg-white"
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <User className="w-4 h-4" /> Responsável
              </label>
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                placeholder="Nome"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={assigneeEmail}
                onChange={(e) => setAssigneeEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4" /> Data início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4" /> Prazo
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Tag className="w-4 h-4" /> Tags
              </label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Clock className="w-4 h-4" /> Horas estimadas
              </label>
              <input
                type="number"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
            >
              {task ? 'Salvar' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

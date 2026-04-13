import { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckSquare, Square, MessageSquare, Calendar, Clock, Tag, User, Save } from 'lucide-react';
import { format } from 'date-fns';
import type { KanbanTask, Priority, Label } from '../../types';
import { useKanbanStore } from '../../stores/kanbanStore';
import { useAuthStore } from '../../stores/authStore';

interface TaskModalProps {
  task: KanbanTask | null;
  columnId?: string;
  onClose: () => void;
}

const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#d946ef', '#14b8a6'];

export default function TaskModal({ task, columnId, onClose }: TaskModalProps) {
  const { createTask, updateTask, deleteTask, activeProject } = useKanbanStore();
  const { user } = useAuthStore();

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours?.toString() || '');
  const [assigneeName, setAssigneeName] = useState(task?.assigneeName || '');
  const [labels, setLabels] = useState<Label[]>(task?.labels || []);
  const [checklist, setChecklist] = useState(task?.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(task?.comments || []);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'details' | 'checklist' | 'comments'>('details');

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const data: Partial<KanbanTask> = {
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      assigneeName: assigneeName || undefined,
      labels,
      checklist,
      comments,
      projectId: activeProject?.id || '',
    };
    try {
      if (task) {
        await updateTask(task.id, data);
      } else {
        await createTask({ ...data, columnId, status: 'todo' }, user!.uid);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (confirm('Excluir esta tarefa?')) {
      await deleteTask(task.id);
      onClose();
    }
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist([...checklist, { id: Date.now().toString(), text: newCheckItem, completed: false }]);
    setNewCheckItem('');
  };

  const toggleCheckItem = (id: string) => {
    setChecklist(checklist.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c)));
  };

  const removeCheckItem = (id: string) => {
    setChecklist(checklist.filter((c) => c.id !== id));
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now().toString(),
        authorId: user?.uid || '',
        authorName: user?.displayName || 'Usuário',
        text: newComment,
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewComment('');
  };

  const addLabel = () => {
    if (!newLabelName.trim()) return;
    setLabels([...labels, { id: Date.now().toString(), name: newLabelName, color: newLabelColor }]);
    setNewLabelName('');
    setShowLabelPicker(false);
  };

  const removeLabel = (id: string) => setLabels(labels.filter((l) => l.id !== id));

  const completedCount = checklist.filter((c) => c.completed).length;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">{task ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <div className="flex items-center gap-2">
            {task && (
              <button onClick={handleDelete} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['details', 'checklist', 'comments'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'details' ? 'Detalhes' : t === 'checklist' ? `Checklist (${completedCount}/${checklist.length})` : `Comentários (${comments.length})`}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {tab === 'details' && (
            <>
              {/* Title */}
              <div>
                <label className="label">Título *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="Título da tarefa"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Descreva a tarefa..."
                />
              </div>

              {/* Grid: Priority, Due date, Hours, Assignee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-1">
                    <Tag size={13} /> Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="input"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="label flex items-center gap-1">
                    <Calendar size={13} /> Data de entrega
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label flex items-center gap-1">
                    <Clock size={13} /> Horas estimadas
                  </label>
                  <input
                    type="number"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="input"
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="label flex items-center gap-1">
                    <User size={13} /> Responsável
                  </label>
                  <input
                    type="text"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="input"
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="label flex items-center gap-1">
                  <Tag size={13} /> Etiquetas
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {labels.map((label) => (
                    <span
                      key={label.id}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full cursor-pointer"
                      style={{ backgroundColor: label.color + '25', color: label.color, border: `1px solid ${label.color}50` }}
                      onClick={() => removeLabel(label.id)}
                    >
                      {label.name} <X size={10} />
                    </span>
                  ))}
                  <button
                    onClick={() => setShowLabelPicker(!showLabelPicker)}
                    className="text-xs px-2 py-1 border border-dashed border-gray-600 text-gray-500 hover:text-gray-300 rounded-full"
                  >
                    + Etiqueta
                  </button>
                </div>

                {showLabelPicker && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="input flex-1 text-sm"
                      placeholder="Nome da etiqueta"
                    />
                    <div className="flex gap-1">
                      {LABEL_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewLabelColor(color)}
                          className={`w-5 h-5 rounded-full border-2 ${newLabelColor === color ? 'border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button onClick={addLabel} className="btn-primary text-xs py-1.5">
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'checklist' && (
            <div>
              {checklist.length > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-right">{completedCount}/{checklist.length} concluídos</p>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 group">
                    <button onClick={() => toggleCheckItem(item.id)} className="flex-shrink-0">
                      {item.completed ? (
                        <CheckSquare size={18} className="text-indigo-400" />
                      ) : (
                        <Square size={18} className="text-gray-500" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeCheckItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCheckItem()}
                  className="input flex-1 text-sm"
                  placeholder="Novo item..."
                />
                <button onClick={addCheckItem} className="btn-primary">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {tab === 'comments' && (
            <div>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-200">{comment.authorName}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(comment.createdAt), 'dd/MM HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{comment.text}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-gray-600">
                    <MessageSquare size={32} className="mb-2" />
                    <p className="text-sm">Sem comentários</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addComment()}
                  className="input flex-1 text-sm"
                  placeholder="Escreva um comentário..."
                />
                <button onClick={addComment} className="btn-primary">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-800">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

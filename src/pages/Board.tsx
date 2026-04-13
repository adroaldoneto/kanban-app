import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useKanban } from '../contexts/KanbanContext'
import type { KanbanCard, CardStatus, Priority } from '../types'
import {
  Plus,
  Clock,
  Flag,
  X,
  Trash2,
  Edit3,
} from 'lucide-react'
import { format, parseISO, isPast } from 'date-fns'

const COLUMNS: { id: CardStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: '#94a3b8' },
  { id: 'todo', title: 'A Fazer', color: '#3b82f6' },
  { id: 'in_progress', title: 'Em Progresso', color: '#f59e0b' },
  { id: 'review', title: 'Revisão', color: '#8b5cf6' },
  { id: 'done', title: 'Concluído', color: '#22c55e' },
]

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low: { label: 'Baixa', color: 'text-slate-600', bg: 'bg-slate-100' },
  medium: { label: 'Média', color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { label: 'Alta', color: 'text-amber-600', bg: 'bg-amber-100' },
  urgent: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-100' },
}

export default function Board() {
  const { cards, currentProject, addCard, updateCard, deleteCard, moveCard, teamMembers } = useKanban()
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null)
  const [showNewCardModal, setShowNewCardModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null)
  const [newCardColumn, setNewCardColumn] = useState<CardStatus>('todo')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const columnCards = useMemo(() => {
    const result: Record<CardStatus, KanbanCard[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    }
    cards.forEach((card) => {
      if (result[card.status]) result[card.status].push(card)
    })
    Object.keys(result).forEach((key) => {
      result[key as CardStatus].sort((a, b) => a.order - b.order)
    })
    return result
  }, [cards])

  function handleDragStart(event: DragStartEvent) {
    const card = cards.find((c) => c.id === event.active.id)
    setActiveCard(card || null)
  }

  function handleDragOver(_event: DragOverEvent) {}

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeCardData = cards.find((c) => c.id === activeId)
    if (!activeCardData) return

    const isOverColumn = COLUMNS.some((col) => col.id === overId)

    if (isOverColumn) {
      const newStatus = overId as CardStatus
      const targetCards = columnCards[newStatus]
      await moveCard(activeId, newStatus, targetCards.length)
    } else {
      const overCard = cards.find((c) => c.id === overId)
      if (!overCard) return
      const newStatus = overCard.status
      await moveCard(activeId, newStatus, overCard.order)
    }
  }

  function openNewCard(columnId: CardStatus) {
    setNewCardColumn(columnId)
    setShowNewCardModal(true)
  }

  function openEditCard(card: KanbanCard) {
    setEditingCard(card)
    setShowEditModal(true)
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum projeto selecionado</h2>
          <p className="text-gray-500">Crie ou selecione um projeto nas configurações.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-sm text-gray-500">{currentProject.name} — {cards.length} tarefas</p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              cards={columnCards[col.id]}
              onAddCard={() => openNewCard(col.id)}
              onEditCard={openEditCard}
              onDeleteCard={deleteCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && <CardItem card={activeCard} isDragOverlay />}
        </DragOverlay>
      </DndContext>

      {showNewCardModal && (
        <CardModal
          mode="create"
          initialStatus={newCardColumn}
          projectId={currentProject.id}
          teamMembers={teamMembers}
          onSave={async (data) => {
            await addCard(data)
            setShowNewCardModal(false)
          }}
          onClose={() => setShowNewCardModal(false)}
        />
      )}

      {showEditModal && editingCard && (
        <CardModal
          mode="edit"
          initialData={editingCard}
          projectId={currentProject.id}
          teamMembers={teamMembers}
          onSave={async (data) => {
            await updateCard(editingCard.id, data)
            setShowEditModal(false)
            setEditingCard(null)
          }}
          onClose={() => {
            setShowEditModal(false)
            setEditingCard(null)
          }}
        />
      )}
    </div>
  )
}

function Column({
  column,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: {
  column: { id: CardStatus; title: string; color: string }
  cards: KanbanCard[]
  onAddCard: () => void
  onEditCard: (card: KanbanCard) => void
  onDeleteCard: (id: string) => void
}) {
  const { setNodeRef } = useSortable({ id: column.id })

  return (
    <div ref={setNodeRef} className="kanban-column flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="font-semibold text-gray-800 text-sm">{column.title}</h3>
          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
            {cards.length}
          </span>
        </div>
        <button
          onClick={onAddCard}
          className="p-1 rounded hover:bg-gray-200 text-gray-500"
        >
          <Plus size={16} />
        </button>
      </div>

      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto min-h-[100px]">
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={onAddCard}
        className="mt-2 w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={14} />
        Adicionar
      </button>
    </div>
  )
}

function SortableCard({
  card,
  onEdit,
  onDelete,
}: {
  card: KanbanCard
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardItem card={card} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

function CardItem({
  card,
  isDragOverlay,
  onEdit,
  onDelete,
}: {
  card: KanbanCard
  isDragOverlay?: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  const priorityCfg = PRIORITY_CONFIG[card.priority]
  const isOverdue =
    card.dueDate && isPast(parseISO(card.dueDate)) && card.status !== 'done'

  return (
    <div
      className={`bg-white rounded-lg p-3 border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing
        ${isDragOverlay ? 'shadow-xl rotate-2' : 'hover:shadow-md'}
        ${isOverdue ? 'border-red-300' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-800 flex-1 pr-2">{card.title}</h4>
        {onEdit && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="p-1 rounded hover:bg-gray-100 text-gray-400"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.() }}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {card.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{card.description}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        {card.tags?.map((tag) => (
          <span
            key={tag}
            className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${priorityCfg.bg} ${priorityCfg.color}`}>
            <Flag size={10} />
            {priorityCfg.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {card.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              <Clock size={10} />
              {format(parseISO(card.dueDate), 'dd/MM')}
            </span>
          )}
          {card.assignee && (
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
              {card.assignee[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function CardModal({
  mode,
  initialStatus,
  initialData,
  projectId,
  teamMembers,
  onSave,
  onClose,
}: {
  mode: 'create' | 'edit'
  initialStatus?: CardStatus
  initialData?: KanbanCard
  projectId: string
  teamMembers: any[]
  onSave: (data: any) => Promise<void>
  onClose: () => void
}) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [status, setStatus] = useState<CardStatus>(initialData?.status || initialStatus || 'todo')
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'medium')
  const [assignee, setAssignee] = useState(initialData?.assignee || '')
  const [assigneeEmail, setAssigneeEmail] = useState(initialData?.assigneeEmail || '')
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '')
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [tagsText, setTagsText] = useState(initialData?.tags?.join(', ') || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean)
    await onSave({
      title,
      description,
      status,
      priority,
      assignee,
      assigneeEmail,
      dueDate,
      startDate,
      tags,
      projectId,
    })
    setSaving(false)
  }

  const handleMemberSelect = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId)
    if (member) {
      setAssignee(member.name)
      setAssigneeEmail(member.email)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-lg">
            {mode === 'create' ? 'Nova Tarefa' : 'Editar Tarefa'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Título da tarefa"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[80px]"
              placeholder="Descreva a tarefa..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CardStatus)}
                className="input-field"
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="input-field"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
            {teamMembers.length > 0 ? (
              <select
                value={teamMembers.find((m) => m.name === assignee)?.id || ''}
                onChange={(e) => handleMemberSelect(e.target.value)}
                className="input-field"
              >
                <option value="">Selecionar membro</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            ) : (
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="input-field"
                placeholder="Nome do responsável"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Limite</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              className="input-field"
              placeholder="bug, feature, design (separadas por vírgula)"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Salvando...' : mode === 'create' ? 'Criar Tarefa' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

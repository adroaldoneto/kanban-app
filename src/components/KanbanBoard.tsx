import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardRow, ColumnRow } from "../hooks/useBoardData";
import styles from "./KanbanBoard.module.css";

function sortInColumn(cards: CardRow[], columnId: string) {
  return cards
    .filter((c) => c.columnId === columnId)
    .sort((a, b) => a.order - b.order);
}

function SortableCard({
  card,
  onOpen,
}: {
  card: CardRow;
  onOpen: (c: CardRow) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.card}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        className={styles.cardOpen}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(card);
        }}
      >
        Abrir
      </button>
      <div className={styles.cardTitle}>{card.title}</div>
      {card.description ? (
        <p className={styles.cardDesc}>{card.description}</p>
      ) : null}
      <div className={styles.cardDates}>
        {card.startDate} → {card.endDate}
      </div>
    </div>
  );
}

interface Props {
  columns: ColumnRow[];
  cards: CardRow[];
  moveCard: (cardId: string, toColumnId: string, targetIndex: number) => void;
  onEditCard: (card: CardRow) => void;
  onAddCard: (columnId: string) => void;
}

function ColumnDropZone({
  column,
  cards,
  activeId,
  onEditCard,
  onAddCard,
}: {
  column: ColumnRow;
  cards: CardRow[];
  activeId: string | null;
  onEditCard: (card: CardRow) => void;
  onAddCard: (columnId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const colCards = sortInColumn(cards, column.id);
  const ids = colCards.map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ""}`}
      id={column.id}
    >
      <header className={styles.columnHead}>
        <h3>{column.title}</h3>
        <span className={styles.badge}>{colCards.length}</span>
      </header>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={styles.cardList}>
          {colCards.map((card) => (
            <SortableCard key={card.id} card={card} onOpen={onEditCard} />
          ))}
          {activeId && colCards.length === 0 ? (
            <div className={styles.dropHint}>Solte aqui</div>
          ) : null}
        </div>
      </SortableContext>
      <button
        type="button"
        className={styles.addBtn}
        onClick={() => onAddCard(column.id)}
      >
        + Cartão
      </button>
    </div>
  );
}

export function KanbanBoard({
  columns,
  cards,
  moveCard,
  onEditCard,
  onAddCard,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedCols = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns]
  );

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const activeCardId = String(active.id);
    const ac = cards.find((c) => c.id === activeCardId);
    if (!ac) return;

    const overId = String(over.id);
    const overCard = cards.find((c) => c.id === overId);
    const overColumn = sortedCols.find((c) => c.id === overId);

    let targetColumnId: string;
    let targetIndex: number;

    if (overCard) {
      targetColumnId = overCard.columnId;
      const colList = sortInColumn(
        cards.filter((c) => c.id !== activeCardId),
        targetColumnId
      );
      targetIndex = colList.findIndex((c) => c.id === overId);
      if (targetIndex < 0) targetIndex = colList.length;
    } else if (overColumn) {
      targetColumnId = overColumn.id;
      targetIndex = sortInColumn(
        cards.filter((c) => c.id !== activeCardId),
        targetColumnId
      ).length;
    } else {
      return;
    }

    moveCard(activeCardId, targetColumnId, targetIndex);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className={styles.board}>
        {sortedCols.map((col) => (
          <ColumnDropZone
            key={col.id}
            column={col}
            cards={cards}
            activeId={activeId}
            onEditCard={onEditCard}
            onAddCard={onAddCard}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className={`${styles.card} ${styles.cardOverlay}`}>
            <div className={styles.cardTitle}>{activeCard.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

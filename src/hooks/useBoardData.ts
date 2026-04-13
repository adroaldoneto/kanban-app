import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  type Unsubscribe,
  type UpdateData,
} from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "../lib/firebase";
import type { CardDoc, ColumnDoc } from "../lib/types";
import { DEFAULT_COLUMNS } from "../lib/types";

export type ColumnRow = ColumnDoc & { id: string };
export type CardRow = CardDoc & { id: string };

const DEMO_KEY = "kanban-demo-v1";

interface DemoStore {
  columns: ColumnRow[];
  cards: CardRow[];
}

function loadDemo(): DemoStore {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) {
      const p = JSON.parse(raw) as DemoStore;
      if (p.columns?.length && p.cards) return p;
    }
  } catch {
    /* ignore */
  }
  const columns: ColumnRow[] = DEFAULT_COLUMNS.map((c) => ({
    id: c.id,
    title: c.title,
    order: c.order,
  }));
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const cards: CardRow[] = [
    {
      id: "demo-1",
      title: "Integrar com app de escala",
      description: "Usar o mesmo projeto Firebase (Auth + Firestore).",
      columnId: "doing",
      order: 0,
      startDate: today,
      endDate: today,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "demo-2",
      title: "Relatório diário",
      description: "Exportar PDF ou imagem e enviar por e-mail.",
      columnId: "todo",
      order: 0,
      startDate: today,
      endDate: today,
      createdAt: now,
      updatedAt: now,
    },
  ];
  return { columns, cards };
}

function saveDemo(store: DemoStore) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(store));
}

function sortColumns(cols: ColumnRow[]) {
  return [...cols].sort((a, b) => a.order - b.order);
}

function sortCardsInColumn(cards: CardRow[], columnId: string) {
  return cards
    .filter((c) => c.columnId === columnId)
    .sort((a, b) => a.order - b.order);
}

export function useBoardData(
  userId: string | null,
  boardId: string | null,
  firebaseMode: boolean
) {
  const [columns, setColumns] = useState<ColumnRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pathPrefix = useMemo(() => {
    if (!userId || !boardId) return null;
    return `users/${userId}/boards/${boardId}`;
  }, [userId, boardId]);

  useEffect(() => {
    if (!userId || !boardId) {
      setColumns([]);
      setCards([]);
      setLoading(false);
      return;
    }

    if (!firebaseMode || !isFirebaseConfigured()) {
      const demo = loadDemo();
      setColumns(sortColumns(demo.columns));
      setCards(demo.cards);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const db = getDb();
    const colRef = collection(db, `${pathPrefix}/columns`);
    const cardRef = collection(db, `${pathPrefix}/cards`);
    const qCol = query(colRef, orderBy("order"));
    const qCard = query(cardRef, orderBy("order"));

    const unsubs: Unsubscribe[] = [];

    unsubs.push(
      onSnapshot(
        qCol,
        (snap) => {
          const rows: ColumnRow[] = [];
          snap.forEach((d) => {
            rows.push({ id: d.id, ...(d.data() as ColumnDoc) });
          });
          setColumns(sortColumns(rows));
          setLoading(false);
        },
        (e) => {
          setError(e.message);
          setLoading(false);
        }
      )
    );

    unsubs.push(
      onSnapshot(
        qCard,
        (snap) => {
          const rows: CardRow[] = [];
          snap.forEach((d) => {
            rows.push({ id: d.id, ...(d.data() as CardDoc) });
          });
          setCards(rows);
        },
        (e) => setError(e.message)
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [userId, boardId, pathPrefix, firebaseMode]);

  const persistDemo = useCallback((nextCols: ColumnRow[], nextCards: CardRow[]) => {
    saveDemo({ columns: nextCols, cards: nextCards });
  }, []);

  const moveCard = useCallback(
    async (cardId: string, toColumnId: string, targetIndex: number) => {
      if (!userId || !boardId) return;

      if (!firebaseMode || !isFirebaseConfigured()) {
        setCards((prev) => {
          const card = prev.find((c) => c.id === cardId);
          if (!card) return prev;
          const fromColumnId = card.columnId;
          const others = prev.filter((c) => c.id !== cardId);
          const inTarget = sortCardsInColumn(others, toColumnId);
          const newOrder = [...inTarget];
          newOrder.splice(
            Math.min(targetIndex, newOrder.length),
            0,
            { ...card, columnId: toColumnId }
          );
          const renumberedTarget = newOrder.map((c, i) => ({
            ...c,
            columnId: toColumnId,
            order: i,
            updatedAt: Date.now(),
          }));
          let rest = others.filter((c) => c.columnId !== toColumnId);
          if (fromColumnId !== toColumnId) {
            const inSource = sortCardsInColumn(rest, fromColumnId);
            const reSource = inSource.map((c, i) => ({
              ...c,
              order: i,
              updatedAt: Date.now(),
            }));
            rest = rest.filter((c) => c.columnId !== fromColumnId);
            rest.push(...reSource);
          }
          const next = [...rest, ...renumberedTarget];
          persistDemo(columns, next);
          return next;
        });
        return;
      }

      const db = getDb();
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      const others = cards.filter((c) => c.id !== cardId);
      const fromColumnId = card.columnId;

      const inTarget = sortCardsInColumn(others, toColumnId);
      const inserted = [...inTarget];
      inserted.splice(Math.min(targetIndex, inserted.length), 0, {
        ...card,
        columnId: toColumnId,
      });

      const batch = writeBatch(db);
      inserted.forEach((c, i) => {
        const ref = doc(db, `${pathPrefix}/cards/${c.id}`);
        batch.update(ref, {
          columnId: toColumnId,
          order: i,
          updatedAt: Date.now(),
        });
      });

      if (fromColumnId !== toColumnId) {
        const inSource = sortCardsInColumn(others, fromColumnId);
        inSource.forEach((c, i) => {
          const ref = doc(db, `${pathPrefix}/cards/${c.id}`);
          batch.update(ref, { order: i, updatedAt: Date.now() });
        });
      }

      await batch.commit();
    },
    [
      userId,
      boardId,
      firebaseMode,
      cards,
      columns,
      pathPrefix,
      persistDemo,
    ]
  );

  const addCard = useCallback(
    async (
      partial: Pick<
        CardDoc,
        | "title"
        | "description"
        | "startDate"
        | "endDate"
        | "columnId"
        | "assigneeEmail"
      >
    ) => {
      if (!userId || !boardId) return;
      const now = Date.now();
      const inCol = sortCardsInColumn(cards, partial.columnId);
      const order = inCol.length;

      if (!firebaseMode || !isFirebaseConfigured()) {
        const id = `local-${now}`;
        const row: CardRow = {
          id,
          title: partial.title,
          description: partial.description,
          columnId: partial.columnId,
          startDate: partial.startDate,
          endDate: partial.endDate,
          order,
          createdAt: now,
          updatedAt: now,
          ...(partial.assigneeEmail
            ? { assigneeEmail: partial.assigneeEmail }
            : {}),
        };
        const next = [...cards, row];
        setCards(next);
        persistDemo(columns, next);
        return;
      }

      const db = getDb();
      const payload: Record<string, unknown> = {
        title: partial.title,
        description: partial.description,
        columnId: partial.columnId,
        startDate: partial.startDate,
        endDate: partial.endDate,
        order,
        createdAt: now,
        updatedAt: now,
      };
      if (partial.assigneeEmail) {
        payload.assigneeEmail = partial.assigneeEmail;
      }
      await addDoc(collection(db, `${pathPrefix}/cards`), payload);
    },
    [userId, boardId, firebaseMode, cards, columns, pathPrefix, persistDemo]
  );

  const updateCard = useCallback(
    async (cardId: string, patch: Partial<CardDoc>) => {
      if (!userId || !boardId) return;
      if (!firebaseMode || !isFirebaseConfigured()) {
        setCards((prev) => {
          const next = prev.map((c) => {
            if (c.id !== cardId) return c;
            const merged = { ...c, ...patch, updatedAt: Date.now() };
            if (patch.assigneeEmail === "") {
              delete (merged as Partial<CardRow>).assigneeEmail;
            }
            return merged;
          });
          persistDemo(columns, next);
          return next;
        });
        return;
      }
      const db = getDb();
      const { assigneeEmail, ...rest } = patch;
      const firebasePatch: Record<string, unknown> = {
        ...rest,
        updatedAt: Date.now(),
      };
      if (assigneeEmail !== undefined) {
        firebasePatch.assigneeEmail = assigneeEmail
          ? assigneeEmail
          : deleteField();
      }
      await updateDoc(
        doc(db, `${pathPrefix}/cards/${cardId}`),
        firebasePatch as UpdateData<CardDoc>
      );
    },
    [userId, boardId, firebaseMode, columns, pathPrefix, persistDemo]
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      if (!userId || !boardId) return;
      if (!firebaseMode || !isFirebaseConfigured()) {
        setCards((prev) => {
          const next = prev.filter((c) => c.id !== cardId);
          persistDemo(columns, next);
          return next;
        });
        return;
      }
      const db = getDb();
      await deleteDoc(doc(db, `${pathPrefix}/cards/${cardId}`));
    },
    [userId, boardId, firebaseMode, columns, pathPrefix, persistDemo]
  );

  return {
    columns,
    cards,
    loading,
    error,
    moveCard,
    addCard,
    updateCard,
    deleteCard,
  };
}

export async function ensureDefaultBoard(
  uid: string,
  boardId: string
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const db = getDb();
  const boardRef = doc(db, `users/${uid}/boards/${boardId}`);
  const snap = await getDocs(collection(db, `${boardRef.path}/columns`));
  if (!snap.empty) return;
  const batch = writeBatch(db);
  batch.set(boardRef, {
    name: "Quadro principal",
    ownerUid: uid,
    createdAt: Date.now(),
  });
  for (const c of DEFAULT_COLUMNS) {
    const cref = doc(db, `${boardRef.path}/columns/${c.id}`);
    batch.set(cref, { title: c.title, order: c.order });
  }
  await batch.commit();
}

export const DEFAULT_BOARD_ID = "default";

import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { KanbanTask, KanbanColumn, Project, TaskStatus } from '../types';

const DEFAULT_COLUMNS: Omit<KanbanColumn, 'id' | 'projectId'>[] = [
  { title: 'Backlog', status: 'backlog', color: '#6b7280', order: 0 },
  { title: 'A Fazer', status: 'todo', color: '#3b82f6', order: 1 },
  { title: 'Em Progresso', status: 'in_progress', color: '#f59e0b', order: 2 },
  { title: 'Revisão', status: 'review', color: '#8b5cf6', order: 3 },
  { title: 'Concluído', status: 'done', color: '#10b981', order: 4 },
];

interface KanbanState {
  projects: Project[];
  activeProject: Project | null;
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  loading: boolean;
  error: string | null;

  subscribeProjects: (userId: string) => () => void;
  createProject: (data: Partial<Project>, userId: string) => Promise<string>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (project: Project | null) => void;

  subscribeBoard: (projectId: string) => () => void;
  moveTask: (taskId: string, newColumnId: string, newStatus: TaskStatus, newOrder: number) => Promise<void>;
  createTask: (data: Partial<KanbanTask>, userId: string) => Promise<void>;
  updateTask: (id: string, data: Partial<KanbanTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  projects: [],
  activeProject: null,
  columns: [],
  tasks: [],
  loading: false,
  error: null,

  subscribeProjects: (userId) => {
    const q = query(
      collection(db, 'projects'),
      where('members', 'array-contains', userId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
      set({ projects });
      if (projects.length > 0 && !get().activeProject) {
        set({ activeProject: projects[0] });
      }
    });
    return unsub;
  },

  createProject: async (data, userId) => {
    const batch = writeBatch(db);
    const projectRef = doc(collection(db, 'projects'));
    const projectData: Partial<Project> = {
      ...data,
      ownerId: userId,
      members: [userId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(projectRef, projectData);

    for (const col of DEFAULT_COLUMNS) {
      const colRef = doc(collection(db, 'columns'));
      batch.set(colRef, { ...col, projectId: projectRef.id });
    }

    await batch.commit();
    return projectRef.id;
  },

  updateProject: async (id, data) => {
    await updateDoc(doc(db, 'projects', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  deleteProject: async (id) => {
    await deleteDoc(doc(db, 'projects', id));
  },

  setActiveProject: (project) => set({ activeProject: project }),

  subscribeBoard: (projectId) => {
    const colQ = query(
      collection(db, 'columns'),
      where('projectId', '==', projectId),
      orderBy('order')
    );
    const unsubCols = onSnapshot(colQ, (snap) => {
      const columns = snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanColumn));
      set({ columns });
    });

    const taskQ = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId),
      orderBy('order')
    );
    const unsubTasks = onSnapshot(taskQ, (snap) => {
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanTask));
      set({ tasks });
    });

    return () => {
      unsubCols();
      unsubTasks();
    };
  },

  moveTask: async (taskId, newColumnId, newStatus, newOrder) => {
    await updateDoc(doc(db, 'tasks', taskId), {
      columnId: newColumnId,
      status: newStatus,
      order: newOrder,
      updatedAt: new Date().toISOString(),
    });
  },

  createTask: async (data, userId) => {
    const columnTasks = get().tasks.filter((t) => t.columnId === data.columnId);
    await addDoc(collection(db, 'tasks'), {
      title: '',
      description: '',
      priority: 'medium',
      labels: [],
      checklist: [],
      comments: [],
      ...data,
      order: columnTasks.length,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  updateTask: async (id, data) => {
    await updateDoc(doc(db, 'tasks', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  deleteTask: async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
  },
}));

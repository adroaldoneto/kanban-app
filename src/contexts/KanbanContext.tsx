import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import type { KanbanTask, Project, ColumnId } from '../types';
import { v4Fallback } from '../utils/helpers';

interface KanbanContextType {
  tasks: KanbanTask[];
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (p: Project | null) => void;
  addTask: (task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<KanbanTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newColumnId: ColumnId, newOrder: number) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getTasksByColumn: (columnId: ColumnId) => KanbanTask[];
  loading: boolean;
}

const KanbanContext = createContext<KanbanContextType | null>(null);

export function useKanban() {
  const context = useContext(KanbanContext);
  if (!context) throw new Error('useKanban must be used within KanbanProvider');
  return context;
}

function generateDemoTasks(projectId: string): KanbanTask[] {
  const now = new Date();
  const tasks: KanbanTask[] = [
    {
      id: 'd1', title: 'Definir arquitetura do sistema', description: 'Criar diagrama de arquitetura e definir tecnologias',
      columnId: 'done', priority: 'high', assignee: 'Ana Silva', assigneeEmail: 'ana@demo.com',
      createdAt: new Date(now.getTime() - 15 * 86400000).toISOString(), updatedAt: now.toISOString(),
      dueDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
      startDate: new Date(now.getTime() - 15 * 86400000).toISOString(),
      tags: ['arquitetura', 'planejamento'], order: 0, projectId, completedAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      estimatedHours: 16,
    },
    {
      id: 'd2', title: 'Configurar ambiente de desenvolvimento', description: 'Setup Docker, CI/CD e repositório',
      columnId: 'done', priority: 'high', assignee: 'Carlos Santos', assigneeEmail: 'carlos@demo.com',
      createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(), updatedAt: now.toISOString(),
      dueDate: new Date(now.getTime() - 3 * 86400000).toISOString(),
      startDate: new Date(now.getTime() - 14 * 86400000).toISOString(),
      tags: ['devops', 'infraestrutura'], order: 1, projectId, completedAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
      estimatedHours: 8,
    },
    {
      id: 'd3', title: 'Implementar autenticação', description: 'Login, registro, recuperação de senha com Firebase Auth',
      columnId: 'review', priority: 'high', assignee: 'Maria Oliveira', assigneeEmail: 'maria@demo.com',
      createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(), updatedAt: now.toISOString(),
      dueDate: new Date(now.getTime() + 2 * 86400000).toISOString(),
      startDate: new Date(now.getTime() - 10 * 86400000).toISOString(),
      tags: ['auth', 'firebase', 'segurança'], order: 0, projectId,
      estimatedHours: 24,
    },
    {
      id: 'd4', title: 'Criar API de escalas', description: 'Endpoints REST para CRUD de escalas de trabalho',
      columnId: 'in_progress', priority: 'urgent', assignee: 'Ana Silva', assigneeEmail: 'ana@demo.com',
      createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(), updatedAt: now.toISOString(),
      dueDate: new Date(now.getTime() + 3 * 86400000).toISOString(),
      startDate: new Date(now.getTime() - 7 * 86400000).toISOString(),
      tags: ['api', 'backend', 'escalas'], order: 0, projectId,
      estimatedHours: 40,
    },
    {
      id: 'd5', title: 'Dashboard com métricas', description: 'Painel com gráficos de produtividade e métricas do projeto',
      columnId: 'in_progress', priority: 'medium', assignee: 'Carlos Santos', assigneeEmail: 'carlos@demo.com',
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(), updatedAt: now.toISOString(),
      dueDate: new Date(now.getTime() + 5 * 86400000).toISOString(),
      startDate: new Date(now.getTime() - 5 * 86400000).toISOString(),
      tags: ['frontend', 'dashboard'], order: 1, projectId,
      estimatedHours: 32,
    },
    {
      id: 'd6', title: 'Sistema de notificações', description: 'Notificações push e email para mudanças de status',
      columnId: 'todo', priority: 'medium', assignee: 'Maria Oliveira', assigneeEmail: 'maria@demo.com',
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(), updatedAt: now.toISOString(),
      dueDate: new Date(now.getTime() + 7 * 86400000).toISOString(),
      startDate: new Date(now.getTime() + 1 * 86400000).toISOString(),
      tags: ['notificações', 'email'], order: 0, projectId,
      estimatedHours: 20,
    },
    {
      id: 'd7', title: 'Testes E2E', description: 'Testes end-to-end com Cypress para fluxos críticos',
      columnId: 'todo', priority: 'high', assignee: 'João Pereira', assigneeEmail: 'joao@demo.com',
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(), updatedAt: now.toISOString(),
      dueDate: new Date(now.getTime() + 10 * 86400000).toISOString(),
      startDate: new Date(now.getTime() + 3 * 86400000).toISOString(),
      tags: ['testes', 'qualidade'], order: 1, projectId,
      estimatedHours: 24,
    },
    {
      id: 'd8', title: 'Integração com sistema de escalas', description: 'Conectar kanban ao módulo de escalas existente',
      columnId: 'todo', priority: 'urgent', assignee: 'Ana Silva', assigneeEmail: 'ana@demo.com',
      createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(), updatedAt: now.toISOString(),
      dueDate: new Date(now.getTime() + 4 * 86400000).toISOString(),
      startDate: new Date(now.getTime() + 1 * 86400000).toISOString(),
      tags: ['integração', 'escalas'], order: 2, projectId,
      estimatedHours: 16,
    },
    {
      id: 'd9', title: 'Relatórios em PDF', description: 'Gerar relatórios diários e semanais em formato PDF',
      columnId: 'backlog', priority: 'medium', assignee: 'Carlos Santos', assigneeEmail: 'carlos@demo.com',
      createdAt: now.toISOString(), updatedAt: now.toISOString(),
      dueDate: new Date(now.getTime() + 14 * 86400000).toISOString(),
      startDate: new Date(now.getTime() + 7 * 86400000).toISOString(),
      tags: ['relatórios', 'pdf'], order: 0, projectId,
      estimatedHours: 16,
    },
    {
      id: 'd10', title: 'Deploy em produção', description: 'Configurar pipeline de deploy e publicar versão 1.0',
      columnId: 'backlog', priority: 'low', assignee: 'João Pereira', assigneeEmail: 'joao@demo.com',
      createdAt: now.toISOString(), updatedAt: now.toISOString(),
      dueDate: new Date(now.getTime() + 21 * 86400000).toISOString(),
      startDate: new Date(now.getTime() + 14 * 86400000).toISOString(),
      tags: ['deploy', 'devops'], order: 1, projectId,
      estimatedHours: 8,
    },
  ];
  return tasks;
}

export function KanbanProvider({ children }: { children: ReactNode }) {
  const { userProfile, isDemo } = useAuth();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      const demoProject: Project = {
        id: 'demo-project',
        name: 'Sistema de Escalas v2',
        description: 'Projeto de desenvolvimento do sistema de gestão de escalas integrado com kanban',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'demo-user',
        members: ['Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Pereira'],
        color: '#3b82f6',
      };
      setProjects([demoProject]);
      setCurrentProject(demoProject);
      setTasks(generateDemoTasks('demo-project'));
      setLoading(false);
      return;
    }

    if (!userProfile) {
      setLoading(false);
      return;
    }

    const projectsQuery = query(
      collection(db, 'projects'),
      where('ownerId', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
      setProjects(projectsData);
      if (projectsData.length > 0 && !currentProject) {
        setCurrentProject(projectsData[0]);
      }
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubProjects();
  }, [userProfile, isDemo]);

  useEffect(() => {
    if (isDemo || !currentProject || !userProfile) return;

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('projectId', '==', currentProject.id),
      orderBy('order', 'asc')
    );

    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as KanbanTask)));
    });

    return () => unsubTasks();
  }, [currentProject, isDemo, userProfile]);

  const getTasksByColumn = useCallback(
    (columnId: ColumnId) => tasks.filter((t) => t.columnId === columnId).sort((a, b) => a.order - b.order),
    [tasks]
  );

  async function addTask(task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) {
    const now = new Date().toISOString();
    const columnTasks = tasks.filter((t) => t.columnId === task.columnId);
    const newTask = { ...task, createdAt: now, updatedAt: now, order: columnTasks.length };

    if (isDemo) {
      setTasks((prev) => [...prev, { ...newTask, id: v4Fallback() }]);
      return;
    }
    await addDoc(collection(db, 'tasks'), newTask);
  }

  async function updateTask(id: string, updates: Partial<KanbanTask>) {
    const upd = { ...updates, updatedAt: new Date().toISOString() };
    if (isDemo) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...upd } : t)));
      return;
    }
    await updateDoc(doc(db, 'tasks', id), upd);
  }

  async function deleteTask(id: string) {
    if (isDemo) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'tasks', id));
  }

  async function moveTask(taskId: string, newColumnId: ColumnId, newOrder: number) {
    const updates: Partial<KanbanTask> = {
      columnId: newColumnId,
      order: newOrder,
      updatedAt: new Date().toISOString(),
    };
    if (newColumnId === 'done') {
      updates.completedAt = new Date().toISOString();
    }
    if (isDemo) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
      return;
    }
    await updateDoc(doc(db, 'tasks', taskId), updates);
  }

  async function addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newProject = { ...project, createdAt: now, updatedAt: now };
    if (isDemo) {
      const id = v4Fallback();
      const p = { ...newProject, id };
      setProjects((prev) => [p, ...prev]);
      setCurrentProject(p);
      return;
    }
    const docRef = await addDoc(collection(db, 'projects'), newProject);
    setCurrentProject({ ...newProject, id: docRef.id });
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    const upd = { ...updates, updatedAt: new Date().toISOString() };
    if (isDemo) {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...upd } : p)));
      if (currentProject?.id === id) setCurrentProject((prev) => prev ? { ...prev, ...upd } : prev);
      return;
    }
    await updateDoc(doc(db, 'projects', id), upd);
  }

  async function deleteProject(id: string) {
    if (isDemo) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (currentProject?.id === id) setCurrentProject(null);
      return;
    }
    await deleteDoc(doc(db, 'projects', id));
  }

  return (
    <KanbanContext.Provider
      value={{
        tasks, projects, currentProject, setCurrentProject,
        addTask, updateTask, deleteTask, moveTask,
        addProject, updateProject, deleteProject,
        getTasksByColumn, loading,
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
}

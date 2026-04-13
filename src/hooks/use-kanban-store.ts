"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db, firebaseConfigured } from "@/lib/firebase";
import { demoSchedule, demoTasks, demoUser } from "@/lib/demo-data";
import {
  buildDailyReport,
  defaultProgressForStatus,
  getTaskStats,
  normalizeDateRange,
  sortTasksByTimeline,
} from "@/lib/helpers";
import { loadTasksFromStorage, saveTasksToStorage } from "@/lib/storage";
import type {
  AuthSession,
  KanbanTask,
  LoginCredentials,
  TaskDraft,
  TaskPriority,
  TaskStatus,
} from "@/types";

const storagePrefix = "kanban-scale-suite";

const buildStorageKey = (scope: string) => `${storagePrefix}:${scope}`;

const isTaskStatus = (value: unknown): value is TaskStatus =>
  ["backlog", "todo", "in_progress", "done"].includes(String(value));

const isTaskPriority = (value: unknown): value is TaskPriority =>
  ["Baixa", "Média", "Alta", "Crítica"].includes(String(value));

function normalizeTaskDocument(id: string, data: Record<string, unknown>): KanbanTask {
  const status = isTaskStatus(data.status) ? data.status : "backlog";
  const priority = isTaskPriority(data.priority) ? data.priority : "Média";

  return {
    id,
    title: typeof data.title === "string" ? data.title : "Card sem título",
    description: typeof data.description === "string" ? data.description : "",
    status,
    priority,
    assignee: typeof data.assignee === "string" ? data.assignee : "Sem responsável",
    startDate:
      typeof data.startDate === "string"
        ? data.startDate
        : new Date().toISOString().slice(0, 10),
    endDate:
      typeof data.endDate === "string"
        ? data.endDate
        : new Date().toISOString().slice(0, 10),
    shiftId: typeof data.shiftId === "string" ? data.shiftId : "",
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    progress:
      typeof data.progress === "number"
        ? Math.max(0, Math.min(100, data.progress))
        : defaultProgressForStatus(status),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
  };
}

export function useKanbanStore() {
  const [session, setSession] = useState<AuthSession | null>(firebaseConfigured ? null : demoUser);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [forcedDemo, setForcedDemo] = useState(!firebaseConfigured);
  const [notice, setNotice] = useState<string | null>(
    firebaseConfigured
      ? null
      : "Modo demonstração ativado automaticamente porque o Firebase não foi configurado neste ambiente.",
  );

  const loadLocalDataset = useCallback((scope: string) => {
    const key = buildStorageKey(scope);
    const stored = loadTasksFromStorage(key);

    if (stored.length > 0) {
      setTasks([...stored].sort(sortTasksByTimeline));
      return;
    }

    saveTasksToStorage(key, demoTasks);
    setTasks([...demoTasks].sort(sortTasksByTimeline));
  }, []);

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      loadLocalDataset(demoUser.uid);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (forcedDemo) {
          setLoading(false);
          return;
        }

        if (user) {
          setSession({
            uid: user.uid,
            email: user.email ?? "",
            displayName: user.displayName ?? user.email ?? "Usuário Firebase",
            mode: "firebase",
          });
          setNotice("Sessão Firebase ativa. Os cartões agora podem sincronizar com o Firestore.");
        } else {
          setSession(null);
          setTasks([]);
        }

        setLoading(false);
      },
      () => {
        setNotice("Não foi possível validar a sessão do Firebase. O modo demonstração continua disponível.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [forcedDemo, loadLocalDataset]);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (session.mode === "demo" || forcedDemo || !db) {
      loadLocalDataset(session.uid);
      return;
    }

    const tasksQuery = query(collection(db, "kanbanTasks"), where("ownerId", "==", session.uid));

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const nextTasks = snapshot.docs
          .map((item) => normalizeTaskDocument(item.id, item.data() as Record<string, unknown>))
          .sort(sortTasksByTimeline);

        setTasks(nextTasks);
      },
      () => {
        setNotice("Falha ao sincronizar com o Firestore. Você ainda pode usar o modo demonstração/local.");
      },
    );

    return () => unsubscribe();
  }, [forcedDemo, loadLocalDataset, session]);

  const setCredential = useCallback((field: keyof LoginCredentials, value: string) => {
    setCredentials((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const persistLocally = useCallback(
    (updater: (current: KanbanTask[]) => KanbanTask[]) => {
      const scope = session?.uid ?? demoUser.uid;
      const key = buildStorageKey(scope);

      setTasks((current) => {
        const nextTasks = updater(current).sort(sortTasksByTimeline);
        saveTasksToStorage(key, nextTasks);
        return nextTasks;
      });
    },
    [session?.uid],
  );

  const upsertTask = useCallback(
    async (task: KanbanTask) => {
      if (session?.mode === "firebase" && !forcedDemo && db) {
        await setDoc(doc(db, "kanbanTasks", task.id), {
          ...task,
          ownerId: session.uid,
        });
        return;
      }

      persistLocally((current) => {
        const nextTasks = current.filter((item) => item.id !== task.id);
        return [...nextTasks, task];
      });
    },
    [forcedDemo, persistLocally, session],
  );

  const signIn = useCallback(async () => {
    if (!firebaseConfigured || !auth) {
      setNotice("Preencha o .env.local com as credenciais do Firebase para ativar o login real.");
      return;
    }

    if (!credentials.email || !credentials.password) {
      setNotice("Informe e-mail e senha antes de autenticar no Firebase.");
      return;
    }

    setAuthBusy(true);

    try {
      setForcedDemo(false);
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      setNotice("Autenticação realizada com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao autenticar no Firebase.";
      setNotice(`Erro de autenticação: ${message}`);
    } finally {
      setAuthBusy(false);
    }
  }, [credentials.email, credentials.password]);

  const activateDemoMode = useCallback(async () => {
    setAuthBusy(true);

    try {
      setForcedDemo(true);
      if (auth?.currentUser) {
        await firebaseSignOut(auth);
      }
      setSession(demoUser);
      loadLocalDataset(demoUser.uid);
      setNotice("Modo demonstração ativo. Configure o Firebase e o sistema de escala para a integração real.");
      setLoading(false);
    } finally {
      setAuthBusy(false);
    }
  }, [loadLocalDataset]);

  const signOut = useCallback(async () => {
    setAuthBusy(true);

    try {
      if (session?.mode === "firebase" && auth && !forcedDemo) {
        await firebaseSignOut(auth);
        setNotice("Sessão Firebase encerrada.");
      } else {
        setSession(null);
        setTasks([]);
        setNotice("Modo demonstração pausado.");
      }

      setForcedDemo(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao encerrar a sessão.";
      setNotice(message);
    } finally {
      setAuthBusy(false);
    }
  }, [forcedDemo, session?.mode]);

  const addTask = useCallback(
    async (draft: TaskDraft) => {
      const [startDate, endDate] = normalizeDateRange(draft.startDate, draft.endDate);
      const now = new Date().toISOString();
      const task: KanbanTask = {
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        status: "backlog",
        priority: draft.priority,
        assignee: draft.assignee.trim() || "Equipe Operacional",
        startDate,
        endDate,
        shiftId: draft.shiftId,
        tags: draft.tags,
        progress: defaultProgressForStatus("backlog"),
        createdAt: now,
        updatedAt: now,
      };

      await upsertTask(task);
      setNotice(`Cartão "${task.title}" criado com sucesso.`);
    },
    [upsertTask],
  );

  const moveTask = useCallback(
    async (taskId: string, nextStatus: TaskStatus) => {
      const currentTask = tasks.find((task) => task.id === taskId);
      if (!currentTask) {
        return;
      }

      await upsertTask({
        ...currentTask,
        status: nextStatus,
        progress: defaultProgressForStatus(nextStatus),
        updatedAt: new Date().toISOString(),
      });
    },
    [tasks, upsertTask],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (session?.mode === "firebase" && !forcedDemo && db) {
        await deleteDoc(doc(db, "kanbanTasks", taskId));
        setNotice("Cartão removido do Firestore.");
        return;
      }

      persistLocally((current) => current.filter((task) => task.id !== taskId));
      setNotice("Cartão removido do quadro local.");
    },
    [forcedDemo, persistLocally, session],
  );

  const stats = useMemo(() => getTaskStats(tasks, demoSchedule), [tasks]);
  const report = useMemo(() => buildDailyReport(tasks, demoSchedule), [tasks]);

  return {
    firebaseReady: firebaseConfigured,
    session,
    tasks,
    schedule: demoSchedule,
    credentials,
    loading,
    authBusy,
    notice,
    stats,
    report,
    setCredential,
    signIn,
    activateDemoMode,
    signOut,
    addTask,
    moveTask,
    deleteTask,
  };
}

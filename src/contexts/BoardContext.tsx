import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { db, isFirebaseConfigured } from '../firebase'
import { useAuth } from './AuthContext'
import { KanbanTask, TaskInput, TaskStatus } from '../types'

interface BoardContextValue {
  tasks: KanbanTask[]
  loading: boolean
  createTask: (input: TaskInput) => Promise<void>
  updateTask: (taskId: string, input: Partial<TaskInput>) => Promise<void>
  moveTask: (taskId: string, status: TaskStatus) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  importTasks: (tasks: TaskInput[]) => Promise<void>
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined)

function getLocalStorageKey(uid: string) {
  return `kanban-tasks-${uid}`
}

function nowIso() {
  return new Date().toISOString()
}

export function BoardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    if (!isFirebaseConfigured || user.uid === 'demo-user') {
      const local = window.localStorage.getItem(getLocalStorageKey(user.uid))
      setTasks(local ? (JSON.parse(local) as KanbanTask[]) : [])
      setLoading(false)
      return
    }

    const tasksRef = collection(db, 'users', user.uid, 'tasks')
    const taskQuery = query(tasksRef, orderBy('updatedAt', 'desc'))
    const unsubscribe = onSnapshot(taskQuery, (snapshot) => {
      setTasks(snapshot.docs.map((taskDoc) => taskDoc.data() as KanbanTask))
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!user || (isFirebaseConfigured && user.uid !== 'demo-user')) {
      return
    }
    window.localStorage.setItem(getLocalStorageKey(user.uid), JSON.stringify(tasks))
  }, [tasks, user])

  const value = useMemo<BoardContextValue>(() => {
    const createTask: BoardContextValue['createTask'] = async (input) => {
      if (!user) {
        return
      }
      const task: KanbanTask = {
        id: crypto.randomUUID(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        ...input,
      }

      if (!isFirebaseConfigured || user.uid === 'demo-user') {
        setTasks((current) => [task, ...current])
        return
      }

      await setDoc(doc(db, 'users', user.uid, 'tasks', task.id), task)
    }

    const updateTask: BoardContextValue['updateTask'] = async (taskId, input) => {
      if (!user) {
        return
      }

      if (!isFirebaseConfigured || user.uid === 'demo-user') {
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId ? { ...task, ...input, updatedAt: nowIso() } : task,
          ),
        )
        return
      }

      const target = tasks.find((task) => task.id === taskId)
      if (!target) {
        return
      }

      await updateDoc(doc(db, 'users', user.uid, 'tasks', target.id), {
        ...input,
        updatedAt: nowIso(),
      })
    }

    const moveTask: BoardContextValue['moveTask'] = async (taskId, status) => {
      await updateTask(taskId, { status })
    }

    const deleteTaskById: BoardContextValue['deleteTask'] = async (taskId) => {
      if (!user) {
        return
      }

      if (!isFirebaseConfigured || user.uid === 'demo-user') {
        setTasks((current) => current.filter((task) => task.id !== taskId))
        return
      }

      const target = tasks.find((task) => task.id === taskId)
      if (!target) {
        return
      }

      await deleteDoc(doc(db, 'users', user.uid, 'tasks', target.id))
    }

    const importTasks: BoardContextValue['importTasks'] = async (items) => {
      for (const task of items) {
        await createTask(task)
      }
    }

    return {
      tasks,
      loading,
      createTask,
      updateTask,
      moveTask,
      deleteTask: deleteTaskById,
      importTasks,
    }
  }, [loading, tasks, user])

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

export function useBoard() {
  const context = useContext(BoardContext)
  if (!context) {
    throw new Error('useBoard precisa ser usado dentro de BoardProvider')
  }
  return context
}

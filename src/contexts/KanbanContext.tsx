import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react'
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'
import type {
  KanbanCard,
  CardStatus,
  Project,
  ScheduleEntry,
  TeamMember,
} from '../types'

interface KanbanContextType {
  cards: KanbanCard[]
  projects: Project[]
  currentProject: Project | null
  schedule: ScheduleEntry[]
  teamMembers: TeamMember[]
  loading: boolean
  setCurrentProject: (project: Project | null) => void
  addCard: (card: Omit<KanbanCard, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<void>
  updateCard: (id: string, updates: Partial<KanbanCard>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  moveCard: (cardId: string, newStatus: CardStatus, newOrder: number) => Promise<void>
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => Promise<void>
  updateScheduleEntry: (id: string, updates: Partial<ScheduleEntry>) => Promise<void>
  deleteScheduleEntry: (id: string) => Promise<void>
  addTeamMember: (member: Omit<TeamMember, 'id'>) => Promise<void>
  deleteTeamMember: (id: string) => Promise<void>
}

const KanbanContext = createContext<KanbanContextType | null>(null)

export function useKanban() {
  const context = useContext(KanbanContext)
  if (!context) throw new Error('useKanban must be used within KanbanProvider')
  return context
}

export function KanbanProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setCards([])
      setProjects([])
      setSchedule([])
      setTeamMembers([])
      setLoading(false)
      return
    }

    setLoading(true)

    const projectsQuery = query(
      collection(db, 'projects'),
      where('ownerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Project[]
      setProjects(projectsData)
      if (projectsData.length > 0 && !currentProject) {
        setCurrentProject(projectsData[0])
      }
      setLoading(false)
    }, () => {
      setLoading(false)
    })

    const membersQuery = query(
      collection(db, 'teamMembers'),
      where('ownerId', '==', currentUser.uid)
    )
    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      setTeamMembers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as TeamMember[])
    })

    return () => {
      unsubProjects()
      unsubMembers()
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !currentProject) return

    const cardsQuery = query(
      collection(db, 'cards'),
      where('projectId', '==', currentProject.id),
      orderBy('order', 'asc')
    )
    const unsubCards = onSnapshot(cardsQuery, (snapshot) => {
      setCards(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as KanbanCard[])
    })

    const scheduleQuery = query(
      collection(db, 'schedule'),
      where('projectId', '==', currentProject.id)
    )
    const unsubSchedule = onSnapshot(scheduleQuery, (snapshot) => {
      setSchedule(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ScheduleEntry[])
    })

    return () => {
      unsubCards()
      unsubSchedule()
    }
  }, [currentUser, currentProject])

  const addCard = useCallback(async (card: Omit<KanbanCard, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    const now = new Date().toISOString()
    const maxOrder = cards.filter((c) => c.status === card.status).length
    await addDoc(collection(db, 'cards'), {
      ...card,
      createdAt: now,
      updatedAt: now,
      order: maxOrder,
    })
  }, [cards])

  const updateCard = useCallback(async (id: string, updates: Partial<KanbanCard>) => {
    await updateDoc(doc(db, 'cards', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  }, [])

  const deleteCard = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'cards', id))
  }, [])

  const moveCard = useCallback(async (cardId: string, newStatus: CardStatus, newOrder: number) => {
    await updateDoc(doc(db, 'cards', cardId), {
      status: newStatus,
      order: newOrder,
      updatedAt: new Date().toISOString(),
    })
  }, [])

  const addProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject = await addDoc(collection(db, 'projects'), {
      ...project,
      createdAt: new Date().toISOString(),
    })
    const created = { id: newProject.id, ...project, createdAt: new Date().toISOString() } as Project
    setCurrentProject(created)
  }, [])

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    await updateDoc(doc(db, 'projects', id), updates)
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'projects', id))
    const cardsSnap = await getDocs(query(collection(db, 'cards'), where('projectId', '==', id)))
    for (const d of cardsSnap.docs) {
      await deleteDoc(doc(db, 'cards', d.id))
    }
    if (currentProject?.id === id) setCurrentProject(null)
  }, [currentProject])

  const addScheduleEntry = useCallback(async (entry: Omit<ScheduleEntry, 'id'>) => {
    await addDoc(collection(db, 'schedule'), entry)
  }, [])

  const updateScheduleEntry = useCallback(async (id: string, updates: Partial<ScheduleEntry>) => {
    await updateDoc(doc(db, 'schedule', id), updates)
  }, [])

  const deleteScheduleEntry = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'schedule', id))
  }, [])

  const addTeamMember = useCallback(async (member: Omit<TeamMember, 'id'>) => {
    if (!currentUser) return
    await addDoc(collection(db, 'teamMembers'), { ...member, ownerId: currentUser.uid })
  }, [currentUser])

  const deleteTeamMember = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'teamMembers', id))
  }, [])

  return (
    <KanbanContext.Provider
      value={{
        cards,
        projects,
        currentProject,
        schedule,
        teamMembers,
        loading,
        setCurrentProject,
        addCard,
        updateCard,
        deleteCard,
        moveCard,
        addProject,
        updateProject,
        deleteProject,
        addScheduleEntry,
        updateScheduleEntry,
        deleteScheduleEntry,
        addTeamMember,
        deleteTeamMember,
      }}
    >
      {children}
    </KanbanContext.Provider>
  )
}

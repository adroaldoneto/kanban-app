import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { auth, isFirebaseConfigured } from '../firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  firebaseReady: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const DEMO_USER = {
  uid: 'demo-user',
  email: 'demo@kanban.local',
  displayName: 'Usuário Demo',
} as unknown as User

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setUser(DEMO_USER)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseReady: isFirebaseConfigured,
      loginWithGoogle: async () => {
        if (!isFirebaseConfigured) {
          setUser(DEMO_USER)
          return
        }
        await signInWithPopup(auth, new GoogleAuthProvider())
      },
      logout: async () => {
        if (!isFirebaseConfigured) {
          setUser(null)
          return
        }
        await signOut(auth)
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de AuthProvider')
  }
  return context
}

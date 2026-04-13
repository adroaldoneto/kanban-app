import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import type { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isDemo: boolean;
  setDemoMode: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data() as UserProfile);
          }
        } catch {
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            role: 'admin',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    const profile: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    setUserProfile(profile);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const profileDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (!profileDoc.exists()) {
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || '',
        photoURL: cred.user.photoURL || undefined,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setUserProfile(profile);
    }
  }

  async function logout() {
    await signOut(auth);
    setIsDemo(false);
    setUserProfile(null);
  }

  function setDemoMode(val: boolean) {
    setIsDemo(val);
    if (val) {
      setLoading(false);
      setUserProfile({
        uid: 'demo-user',
        email: 'demo@kanbanpro.com',
        displayName: 'Usuário Demo',
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        isDemo,
        setDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

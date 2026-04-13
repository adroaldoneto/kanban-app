import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  init: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: false,
  error: null,
  initialized: false,

  init: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            set({
              user: userDoc.data() as User,
              firebaseUser,
              initialized: true,
            });
          } else {
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'Usuário',
              photoURL: firebaseUser.photoURL || undefined,
              role: 'member',
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            set({ user: newUser, firebaseUser, initialized: true });
          }
        } catch {
          set({ user: null, firebaseUser: null, initialized: true });
        }
      } else {
        set({ user: null, firebaseUser: null, initialized: true });
      }
    });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code;
      const messages: Record<string, string> = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'auth/invalid-credential': 'Credenciais inválidas. Verifique e-mail e senha.',
      };
      set({ error: messages[msg || ''] || 'Erro ao fazer login.' });
    } finally {
      set({ loading: false });
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch {
      set({ error: 'Erro ao fazer login com Google.' });
    } finally {
      set({ loading: false });
    }
  },

  register: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(fbUser, { displayName });
      const newUser: User = {
        uid: fbUser.uid,
        email: fbUser.email!,
        displayName,
        role: 'member',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', fbUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
      });
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code;
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'E-mail já cadastrado.',
        'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres).',
        'auth/invalid-email': 'E-mail inválido.',
      };
      set({ error: messages[msg || ''] || 'Erro ao criar conta.' });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, firebaseUser: null });
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      set({ error: 'Erro ao enviar e-mail de recuperação.' });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

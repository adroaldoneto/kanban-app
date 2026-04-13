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
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ScheduleShift } from '../types';

interface ScheduleState {
  shifts: ScheduleShift[];
  loading: boolean;
  error: string | null;
  selectedWeek: Date;

  subscribeShifts: (projectId: string) => () => void;
  createShift: (data: Partial<ScheduleShift>) => Promise<void>;
  updateShift: (id: string, data: Partial<ScheduleShift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  setSelectedWeek: (date: Date) => void;
  getShiftsForDate: (date: string) => ScheduleShift[];
  getShiftsForUser: (userId: string) => ScheduleShift[];
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  shifts: [],
  loading: false,
  error: null,
  selectedWeek: new Date(),

  subscribeShifts: (projectId) => {
    const q = query(
      collection(db, 'shifts'),
      where('projectId', '==', projectId),
      orderBy('date')
    );
    const unsub = onSnapshot(q, (snap) => {
      const shifts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduleShift));
      set({ shifts });
    });
    return unsub;
  },

  createShift: async (data) => {
    await addDoc(collection(db, 'shifts'), {
      status: 'scheduled',
      ...data,
    });
  },

  updateShift: async (id, data) => {
    await updateDoc(doc(db, 'shifts', id), data);
  },

  deleteShift: async (id) => {
    await deleteDoc(doc(db, 'shifts', id));
  },

  setSelectedWeek: (date) => set({ selectedWeek: date }),

  getShiftsForDate: (date) => get().shifts.filter((s) => s.date === date),

  getShiftsForUser: (userId) => get().shifts.filter((s) => s.userId === userId),
}));

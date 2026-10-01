// src/store/useViewStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useViewStore = create(
  persist(
    (set) => ({
      view: 'table', // 'table' | 'grid'
      setView: (view) => set({ view }),
    }),
    { name: 'view-mode' } // key di localStorage
  )
);
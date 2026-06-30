import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Vertical = 'banking' | 'insurance'

interface VerticalState {
  vertical: Vertical
  setVertical: (vertical: Vertical) => void
}

export const useVerticalStore = create<VerticalState>()(
  persist(
    (set) => ({
      vertical: 'banking',
      setVertical: (vertical) => set({ vertical }),
    }),
    {
      name: 'headless360-vertical',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

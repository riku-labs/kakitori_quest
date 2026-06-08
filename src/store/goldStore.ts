import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GoldState {
  gold: number
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
}

export const useGoldStore = create<GoldState>()(
  persist(
    (set, get) => ({
      gold: 0,

      addGold: (amount) => set((s) => ({ gold: s.gold + amount })),

      spendGold: (amount) => {
        if (get().gold < amount) return false
        set((s) => ({ gold: s.gold - amount }))
        return true
      },
    }),
    { name: 'kakitori-quest-gold-v1' },
  ),
)

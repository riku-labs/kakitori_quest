import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DecorationSlotId } from '../config/decorationSlots'
import { ITEMS } from '../config/items'
import { useGoldStore } from './goldStore'

interface WardrobeState {
  potionCount: number
  purchasedDecorations: string[]
  equippedItems: Partial<Record<DecorationSlotId, string>>

  buyItem: (itemId: string) => boolean
  equipDecoration: (itemId: string, slot: DecorationSlotId) => void
  unequipSlot: (slot: DecorationSlotId) => void
  usePotion: () => boolean
}

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      potionCount: 0,
      purchasedDecorations: [],
      equippedItems: {},

      buyItem: (itemId) => {
        const item = ITEMS.find((i) => i.id === itemId)
        if (!item) return false
        if (!useGoldStore.getState().spendGold(item.price)) return false
        if (item.type === 'consumable') {
          set((s) => ({ potionCount: s.potionCount + 1 }))
        } else {
          set((s) => ({ purchasedDecorations: [...s.purchasedDecorations, itemId] }))
        }
        return true
      },

      equipDecoration: (itemId, slot) => {
        set((s) => ({ equippedItems: { ...s.equippedItems, [slot]: itemId } }))
      },

      unequipSlot: (slot) => {
        set((s) => {
          const next = { ...s.equippedItems }
          delete next[slot]
          return { equippedItems: next }
        })
      },

      usePotion: () => {
        if (get().potionCount <= 0) return false
        set((s) => ({ potionCount: s.potionCount - 1 }))
        return true
      },
    }),
    { name: 'kakitori-quest-wardrobe-v1' },
  ),
)

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { PantryItem } from '../types'
import { getItemStatus, STATUS_ORDER } from '../utils/dateUtils'

export function usePantryItems(): PantryItem[] {
  const items = useLiveQuery(() => db.pantryItems.toArray(), [])
  return items ?? []
}

export function useSortedPantryItems(): PantryItem[] {
  const items = usePantryItems()
  return [...items].sort((a, b) => {
    const sa = STATUS_ORDER.indexOf(getItemStatus(a))
    const sb = STATUS_ORDER.indexOf(getItemStatus(b))
    if (sa !== sb) return sa - sb
    return a.name.localeCompare(b.name, 'es')
  })
}

export function useWasteLog() {
  return useLiveQuery(() => db.wasteLog.orderBy('loggedAt').reverse().toArray(), []) ?? []
}

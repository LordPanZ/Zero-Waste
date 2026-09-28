import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { PantryItem, WasteLogEntry } from '../types'
import { getItemStatus, STATUS_ORDER } from '../utils/dateUtils'
import { useActiveProfile } from './useProfiles'

export function usePantryItems(): PantryItem[] {
  const profile = useActiveProfile()
  const items = useLiveQuery(
    () => (profile ? db.pantryItems.where('profileId').equals(profile.id!).toArray() : []),
    [profile?.id],
  )
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

export function useWasteLog(): WasteLogEntry[] {
  const profile = useActiveProfile()
  const entries = useLiveQuery(async () => {
    if (!profile) return []
    const rows = await db.wasteLog.where('profileId').equals(profile.id!).toArray()
    return rows.sort((a, b) => b.loggedAt - a.loggedAt)
  }, [profile?.id])
  return entries ?? []
}

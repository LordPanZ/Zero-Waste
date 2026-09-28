import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettingsRow } from '../db'
import type { Profile } from '../types'

export function useProfiles(): Profile[] {
  return useLiveQuery(() => db.profiles.orderBy('id').toArray(), []) ?? []
}

/** The currently active profile, or undefined while it's still loading/unset. */
export function useActiveProfile(): Profile | undefined {
  const activeProfileId = useLiveQuery(() => getSettingsRow().then((s) => s?.activeProfileId), [])
  return useLiveQuery(
    () => (activeProfileId ? db.profiles.get(activeProfileId) : undefined),
    [activeProfileId],
  )
}

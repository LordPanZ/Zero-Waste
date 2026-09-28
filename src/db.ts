import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, NutritionFacts, PantryItem, Profile, WasteLogEntry } from './types'

class ZeroWasteDB extends Dexie {
  pantryItems!: EntityTable<PantryItem, 'id'>
  wasteLog!: EntityTable<WasteLogEntry, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  nutritionFacts!: EntityTable<NutritionFacts, 'id'>
  profiles!: EntityTable<Profile, 'id'>

  constructor() {
    super('zero-waste-db')
    this.version(1).stores({
      pantryItems: '++id, name, category, storage, expirationDate, trackingMode',
      wasteLog: '++id, itemName, category, outcome, loggedAt',
      settings: '++id, key',
    })
    this.version(2).stores({
      nutritionFacts: '++id, &name',
    })
    // Introduces profiles: existing pantry items / waste log entries get assigned
    // to a freshly created default profile so nothing already saved is orphaned.
    this.version(3)
      .stores({
        pantryItems: '++id, profileId, name, category, storage, expirationDate, trackingMode',
        wasteLog: '++id, profileId, itemName, category, outcome, loggedAt',
        profiles: '++id, name',
      })
      .upgrade(async (tx) => {
        const profileId = await tx.table('profiles').add({ name: 'Yo', emoji: '🙂', createdAt: Date.now() })
        await tx
          .table('pantryItems')
          .toCollection()
          .modify((item: PantryItem) => {
            item.profileId ??= profileId
          })
        await tx
          .table('wasteLog')
          .toCollection()
          .modify((entry: WasteLogEntry) => {
            entry.profileId ??= profileId
          })
        await tx
          .table('settings')
          .toCollection()
          .modify((s: AppSettings) => {
            s.activeProfileId ??= profileId
          })
      })
  }
}

export const db = new ZeroWasteDB()

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

export async function getNutritionByName(name: string): Promise<NutritionFacts | undefined> {
  return db.nutritionFacts.where('name').equals(normalizeName(name)).first()
}

/** Creates or overwrites the saved nutrition facts for a food name (matched case-insensitively). */
export async function upsertNutrition(facts: Omit<NutritionFacts, 'id' | 'name' | 'updatedAt'> & { name: string }): Promise<void> {
  const name = normalizeName(facts.name)
  if (!name) return
  const existing = await db.nutritionFacts.where('name').equals(name).first()
  const record: NutritionFacts = { ...facts, name, updatedAt: Date.now() }
  if (existing) {
    await db.nutritionFacts.update(existing.id!, record)
  } else {
    await db.nutritionFacts.add(record)
  }
}

/** Read-only: safe to call from inside a useLiveQuery (never writes). */
export function getSettingsRow(): Promise<AppSettings | undefined> {
  return db.settings.where('key').equals('app').first()
}

export async function getSettings(): Promise<AppSettings> {
  const existing = await getSettingsRow()
  if (existing) return existing
  const defaults: AppSettings = {
    key: 'app',
    notificationsEnabled: false,
    reminderDaysAhead: 3,
    defaultStorage: 'nevera',
    onboarded: false,
  }
  const id = await db.settings.add(defaults)
  return { ...defaults, id }
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings()
  const updated = { ...current, ...patch }
  await db.settings.put(updated)
  return updated
}

const DEFAULT_PROFILE_EMOJIS = ['🙂', '🧑‍🍳', '👩', '👨', '🧒', '👵', '👴', '🐱']

/**
 * Guarantees a valid active profile exists, creating a first one ("Yo") if this
 * is a brand-new install (fresh IndexedDB skips the version-3 upgrade migration,
 * since that only runs for databases that already existed at an earlier version).
 */
export async function ensureActiveProfile(): Promise<Profile> {
  const settings = await getSettings()
  if (settings.activeProfileId) {
    const current = await db.profiles.get(settings.activeProfileId)
    if (current) return current
  }
  const first = await db.profiles.orderBy('id').first()
  if (first) {
    await updateSettings({ activeProfileId: first.id })
    return first
  }
  const profile: Profile = { name: 'Yo', emoji: DEFAULT_PROFILE_EMOJIS[0], createdAt: Date.now() }
  const id = await db.profiles.add(profile)
  await updateSettings({ activeProfileId: id })
  return { ...profile, id }
}

export function nextDefaultProfileEmoji(existing: Profile[]): string {
  const used = new Set(existing.map((p) => p.emoji))
  return DEFAULT_PROFILE_EMOJIS.find((e) => !used.has(e)) ?? DEFAULT_PROFILE_EMOJIS[0]
}

export async function createProfile(name: string, emoji: string): Promise<number> {
  const id = await db.profiles.add({ name: name.trim(), emoji, createdAt: Date.now() })
  return id as number
}

export async function renameProfile(id: number, name: string): Promise<void> {
  await db.profiles.update(id, { name: name.trim() })
}

export async function updateProfile(id: number, patch: Partial<Pick<Profile, 'name' | 'emoji'>>): Promise<void> {
  const clean: Partial<Pick<Profile, 'name' | 'emoji'>> = {}
  if (patch.name !== undefined) clean.name = patch.name.trim()
  if (patch.emoji !== undefined) clean.emoji = patch.emoji
  await db.profiles.update(id, clean)
}

export async function switchProfile(id: number): Promise<void> {
  await updateSettings({ activeProfileId: id })
}

/** Deletes a profile and everything it owns. Refuses to delete the last remaining profile. */
export async function deleteProfile(id: number): Promise<void> {
  const count = await db.profiles.count()
  if (count <= 1) return

  await db.transaction('rw', db.profiles, db.pantryItems, db.wasteLog, db.settings, async () => {
    await db.pantryItems.where('profileId').equals(id).delete()
    await db.wasteLog.where('profileId').equals(id).delete()
    await db.profiles.delete(id)

    const settings = await getSettings()
    if (settings.activeProfileId === id) {
      const remaining = await db.profiles.orderBy('id').first()
      await updateSettings({ activeProfileId: remaining?.id })
    }
  })
}

import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, PantryItem, WasteLogEntry } from './types'

class ZeroWasteDB extends Dexie {
  pantryItems!: EntityTable<PantryItem, 'id'>
  wasteLog!: EntityTable<WasteLogEntry, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('zero-waste-db')
    this.version(1).stores({
      pantryItems: '++id, name, category, storage, expirationDate, trackingMode',
      wasteLog: '++id, itemName, category, outcome, loggedAt',
      settings: '++id, key',
    })
  }
}

export const db = new ZeroWasteDB()

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.where('key').equals('app').first()
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

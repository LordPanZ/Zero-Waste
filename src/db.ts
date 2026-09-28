import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, NutritionFacts, PantryItem, WasteLogEntry } from './types'

class ZeroWasteDB extends Dexie {
  pantryItems!: EntityTable<PantryItem, 'id'>
  wasteLog!: EntityTable<WasteLogEntry, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  nutritionFacts!: EntityTable<NutritionFacts, 'id'>

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

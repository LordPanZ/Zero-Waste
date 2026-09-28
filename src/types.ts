export type StorageLocation = 'nevera' | 'despensa' | 'congelador'

export type TrackingMode = 'fecha' | 'estimado'

export type FoodCategory =
  | 'fruta'
  | 'verdura'
  | 'lacteo'
  | 'carne'
  | 'pescado'
  | 'panaderia'
  | 'despensa'
  | 'congelado'
  | 'bebida'
  | 'otro'

export interface PantryItem {
  id?: number
  name: string
  category: FoodCategory
  storage: StorageLocation
  quantity: number
  unit: string
  trackingMode: TrackingMode
  /** ISO date (yyyy-MM-dd). Present when trackingMode === 'fecha'. */
  expirationDate?: string
  /** Set when trackingMode === 'estimado': addedDate + shelfLifeDays estimates expirationDate. */
  shelfLifeDays?: number
  addedDate: string
  photo?: string
  notes?: string
  /** true once the user has confirmed/edited an OCR-detected date */
  fromOcr?: boolean
  createdAt: number
  updatedAt: number
}

export type WasteOutcome = 'consumido' | 'desperdiciado'

export interface WasteLogEntry {
  id?: number
  itemName: string
  category: FoodCategory
  quantity: number
  unit: string
  outcome: WasteOutcome
  loggedAt: number
  /** Days the item sat in the pantry before this outcome, when known. */
  daysHeld?: number
}

export interface AppSettings {
  id?: number
  key: 'app'
  notificationsEnabled: boolean
  reminderDaysAhead: number
  defaultStorage: StorageLocation
  onboarded: boolean
}

export type ItemStatus = 'caducado' | 'urgente' | 'proximo' | 'ok' | 'sin-fecha'

/** Nutritional values as printed on the label, per `perGrams` (almost always 100 g/ml). */
export interface NutritionFacts {
  id?: number
  /** Normalized (trimmed, lowercase) food name, used to match pantry items and recipe ingredients. */
  name: string
  perGrams: number
  energyKcal?: number
  fat?: number
  saturatedFat?: number
  carbs?: number
  sugars?: number
  fiber?: number
  protein?: number
  salt?: number
  fromOcr?: boolean
  updatedAt: number
}

export interface Recipe {
  id: string
  name: string
  description: string
  ingredients: string[]
  optionalIngredients?: string[]
  minutes: number
  servings: number
  steps: string[]
  tags: string[]
}

import type { NutritionFacts } from '../types'
import { foodNamesMatch } from './matching'

export const NUTRITION_FIELDS = [
  { key: 'energyKcal', label: 'Energía', unit: 'kcal' },
  { key: 'fat', label: 'Grasas', unit: 'g' },
  { key: 'saturatedFat', label: 'de las cuales saturadas', unit: 'g' },
  { key: 'carbs', label: 'Hidratos de carbono', unit: 'g' },
  { key: 'sugars', label: 'de los cuales azúcares', unit: 'g' },
  { key: 'fiber', label: 'Fibra alimentaria', unit: 'g' },
  { key: 'protein', label: 'Proteínas', unit: 'g' },
  { key: 'salt', label: 'Sal', unit: 'g' },
] as const satisfies { key: keyof ScannedFields; label: string; unit: string }[]

type ScannedFields = Pick<
  NutritionFacts,
  'energyKcal' | 'fat' | 'saturatedFat' | 'carbs' | 'sugars' | 'fiber' | 'protein' | 'salt'
>

export function findNutritionMatch(ingredientName: string, catalog: NutritionFacts[]): NutritionFacts | undefined {
  return catalog.find((entry) => foodNamesMatch(entry.name, ingredientName))
}

export type NutritionTotals = Partial<Record<(typeof NUTRITION_FIELDS)[number]['key'], number>>

/**
 * Sums nutrition values scaled from each entry's reference amount (almost always 100 g)
 * to the grams actually used, across every ingredient supplied.
 */
export function sumNutrition(entries: { facts: NutritionFacts; grams: number }[]): NutritionTotals {
  const totals: NutritionTotals = {}
  for (const { facts, grams } of entries) {
    if (!(grams > 0)) continue
    const factor = grams / (facts.perGrams || 100)
    for (const { key } of NUTRITION_FIELDS) {
      const value = facts[key]
      if (value === undefined) continue
      totals[key] = (totals[key] ?? 0) + value * factor
    }
  }
  return totals
}

export function formatNutritionValue(value: number): string {
  return value >= 100 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, '')
}

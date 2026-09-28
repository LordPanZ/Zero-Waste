import type { NutritionFacts } from '../types'
import { recognizeText } from './ocr'

export type ScannedNutrition = Pick<
  NutritionFacts,
  'energyKcal' | 'fat' | 'saturatedFat' | 'carbs' | 'sugars' | 'fiber' | 'protein' | 'salt'
>

/** Matches a decimal number using either a comma or a dot, e.g. "12,3" or "12.3". */
const NUMBER = /(\d+(?:[.,]\d+)?)/

function firstNumber(text: string): number | undefined {
  const match = text.match(NUMBER)
  if (!match) return undefined
  return Number(match[1].replace(',', '.'))
}

/** One row per nutrient: patterns are tried in order, first line match wins. */
const FIELD_PATTERNS: { key: keyof ScannedNutrition; test: RegExp }[] = [
  { key: 'saturatedFat', test: /saturad|of which saturat/i },
  { key: 'sugars', test: /az[uú]car|sugars?\b/i },
  { key: 'fiber', test: /fibra|fibre/i },
  { key: 'salt', test: /\bsal\b|\bsalt\b/i },
  { key: 'protein', test: /prote[ií]na|protein/i },
  { key: 'carbs', test: /hidratos de carbono|carbohydrate/i },
  { key: 'fat', test: /^gras|^fat\b/i },
  { key: 'energyKcal', test: /valor energ|energ[ií]a|energy/i },
]

/**
 * Parses OCR text from an EU-style nutrition label ("Información nutricional",
 * values per 100 g/ml) into individual fields. Best-effort: labels vary in
 * layout, so callers should let the user review/correct the result.
 */
export function parseNutritionLabel(text: string): ScannedNutrition {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const result: ScannedNutrition = {}
  const claimed = new Set<number>()

  for (const { key, test } of FIELD_PATTERNS) {
    if (result[key] !== undefined) continue

    for (let i = 0; i < lines.length; i++) {
      if (claimed.has(i) || !test.test(lines[i])) continue

      // Saturated fat / sugars lines often repeat the word "grasas"/"hidratos" from the
      // parent row above them, so exclude those from matching the generic fat/carbs pattern.
      if (key === 'fat' && /saturad/i.test(lines[i])) continue
      if (key === 'carbs' && /az[uú]car|sugars?\b/i.test(lines[i])) continue

      let value = firstNumber(lines[i])
      // Value sometimes sits alone on the next line when OCR splits label/number columns.
      if (value === undefined && i + 1 < lines.length) {
        value = firstNumber(lines[i + 1])
      }
      if (value === undefined) continue

      // For energy, prefer the kcal figure over an adjacent kJ figure ("1046kJ/250kcal").
      if (key === 'energyKcal') {
        const kcalMatch = lines[i].match(/(\d+(?:[.,]\d+)?)\s*kcal/i) ?? lines[i + 1]?.match(/(\d+(?:[.,]\d+)?)\s*kcal/i)
        if (kcalMatch) value = Number(kcalMatch[1].replace(',', '.'))
        else continue // no kcal figure on this or the next line; likely just kJ — skip rather than guess wrong
      }

      result[key] = value
      claimed.add(i)
      break
    }
  }

  return result
}

export interface NutritionScanResult {
  text: string
  values: ScannedNutrition
}

/** Runs OCR on a photo of a nutrition label and extracts the per-100g values it can find. */
export async function scanNutritionLabel(image: File | Blob | string): Promise<NutritionScanResult> {
  const text = await recognizeText(image)
  return { text, values: parseNutritionLabel(text) }
}

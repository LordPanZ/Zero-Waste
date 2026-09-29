import { z } from 'zod'

export const FOOD_CATEGORY_VALUES = [
  'fruta',
  'verdura',
  'lacteo',
  'carne',
  'pescado',
  'panaderia',
  'despensa',
  'congelado',
  'bebida',
  'otro',
] as const

const nutritionSchema = z.object({
  energyKcal: z.number().nullable(),
  fat: z.number().nullable(),
  saturatedFat: z.number().nullable(),
  carbs: z.number().nullable(),
  sugars: z.number().nullable(),
  fiber: z.number().nullable(),
  protein: z.number().nullable(),
  salt: z.number().nullable(),
})

export const photoAnalysisSchema = z.object({
  foodName: z.string().nullable(),
  category: z.enum(FOOD_CATEGORY_VALUES).nullable(),
  storage: z.enum(['nevera', 'despensa', 'congelador']).nullable(),
  expirationDate: z.string().nullable(),
  dateLabel: z.string().nullable(),
  dateKind: z.enum(['caducidad', 'consumo_preferente']).nullable(),
  shelfLifeDays: z.number().nullable(),
  nutrition: nutritionSchema.nullable(),
  confidence: z.enum(['alta', 'media', 'baja']),
  message: z.string().nullable(),
})

export type PhotoAnalysis = z.infer<typeof photoAnalysisSchema>

export type ScanHint = 'todo' | 'fecha' | 'nutricion'

export interface AnalyzePhotoRequest {
  image: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
  hint: ScanHint
  today: string
}

export type AnalyzePhotoErrorCode =
  | 'not_configured'
  | 'no_credit'
  | 'bad_key'
  | 'rate_limited'
  | 'refused'
  | 'bad_request'
  | 'forbidden'
  | 'unavailable'

export type AnalyzePhotoResponse =
  | { ok: true; analysis: PhotoAnalysis }
  | { ok: false; error: AnalyzePhotoErrorCode }

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function isValidISODate(value: string): boolean {
  const m = ISO_DATE.exec(value)
  if (!m) return false
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 86_400_000)
}

/** Per-100 g/ml plausibility limits; anything outside is almost certainly a misread. */
const NUTRITION_LIMITS: Record<keyof NonNullable<PhotoAnalysis['nutrition']>, number> = {
  energyKcal: 950,
  fat: 100,
  saturatedFat: 100,
  carbs: 100,
  sugars: 100,
  fiber: 100,
  protein: 100,
  salt: 100,
}

/**
 * Model output is trusted only after sanity checks: a hallucinated or misread
 * value becomes null (the user fills it in) instead of a wrong date in the pantry.
 */
export function sanitizeAnalysis(raw: PhotoAnalysis, todayISO: string): PhotoAnalysis {
  let expirationDate = raw.expirationDate?.trim() || null
  if (expirationDate) {
    const ageDays = isValidISODate(expirationDate) ? daysBetween(expirationDate, todayISO) : Infinity
    const yearsAhead = isValidISODate(expirationDate) ? -ageDays / 365 : Infinity
    // Reject unparsable dates, dates already expired by more than a year, or > 15 years ahead.
    if (!isValidISODate(expirationDate) || ageDays > 365 || yearsAhead > 15) expirationDate = null
  }

  let shelfLifeDays: number | null = null
  if (raw.shelfLifeDays != null && Number.isFinite(raw.shelfLifeDays) && expirationDate == null) {
    shelfLifeDays = Math.min(3650, Math.max(1, Math.round(raw.shelfLifeDays)))
  }

  let nutrition: PhotoAnalysis['nutrition'] = null
  if (raw.nutrition) {
    const cleaned = { ...raw.nutrition }
    let anyValue = false
    for (const key of Object.keys(NUTRITION_LIMITS) as (keyof typeof NUTRITION_LIMITS)[]) {
      const value = cleaned[key]
      if (value == null || !Number.isFinite(value) || value < 0 || value > NUTRITION_LIMITS[key]) {
        cleaned[key] = null
      } else {
        anyValue = true
      }
    }
    if (anyValue) nutrition = cleaned
  }

  return {
    ...raw,
    foodName: raw.foodName?.trim() || null,
    expirationDate,
    dateLabel: expirationDate ? raw.dateLabel : null,
    dateKind: expirationDate ? raw.dateKind : null,
    shelfLifeDays,
    nutrition,
    message: raw.message?.trim() || null,
  }
}

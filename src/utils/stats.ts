import type { WasteLogEntry } from '../types'

export interface WasteStats {
  totalLogged: number
  consumed: number
  wasted: number
  savedRate: number // % consumed vs total, 0-100
  currentStreakDays: number
  categoryBreakdown: { category: string; consumed: number; wasted: number }[]
}

const DAY_MS = 24 * 60 * 60 * 1000

export function computeWasteStats(entries: WasteLogEntry[]): WasteStats {
  const consumed = entries.filter((e) => e.outcome === 'consumido').length
  const wasted = entries.filter((e) => e.outcome === 'desperdiciado').length
  const totalLogged = entries.length
  const savedRate = totalLogged === 0 ? 100 : Math.round((consumed / totalLogged) * 100)

  const byCategory = new Map<string, { consumed: number; wasted: number }>()
  for (const entry of entries) {
    const bucket = byCategory.get(entry.category) ?? { consumed: 0, wasted: 0 }
    if (entry.outcome === 'consumido') bucket.consumed++
    else bucket.wasted++
    byCategory.set(entry.category, bucket)
  }

  return {
    totalLogged,
    consumed,
    wasted,
    savedRate,
    currentStreakDays: computeNoWasteStreak(entries),
    categoryBreakdown: [...byCategory.entries()].map(([category, v]) => ({ category, ...v })),
  }
}

/**
 * Consecutive days up to today with no "desperdiciado" entries logged, capped
 * at how far back the user's history actually goes (first-ever log entry).
 */
function computeNoWasteStreak(entries: WasteLogEntry[]): number {
  if (entries.length === 0) return 0
  const wastedDays = new Set(
    entries.filter((e) => e.outcome === 'desperdiciado').map((e) => new Date(e.loggedAt).toDateString()),
  )
  const oldestLoggedAt = Math.min(...entries.map((e) => e.loggedAt))
  const maxDays = Math.floor((Date.now() - oldestLoggedAt) / DAY_MS) + 1

  let streak = 0
  const cursor = new Date()
  for (let i = 0; i < maxDays; i++) {
    if (wastedDays.has(cursor.toDateString())) break
    streak++
    cursor.setTime(cursor.getTime() - DAY_MS)
  }
  return streak
}

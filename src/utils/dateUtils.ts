import type { ItemStatus, PantryItem } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

export function todayISO(): string {
  return toISO(new Date())
}

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseISODateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Resolves the effective expiration date (ISO), whether typed manually or estimated. */
export function getEffectiveExpirationISO(item: PantryItem): string | undefined {
  if (item.trackingMode === 'fecha') return item.expirationDate
  if (item.trackingMode === 'estimado' && item.shelfLifeDays != null) {
    const added = parseISODateOnly(item.addedDate)
    const expiry = new Date(added.getTime() + item.shelfLifeDays * DAY_MS)
    return toISO(expiry)
  }
  return undefined
}

export function daysUntil(iso: string | undefined): number | undefined {
  if (!iso) return undefined
  const target = parseISODateOnly(iso)
  const diff = target.getTime() - startOfToday().getTime()
  return Math.round(diff / DAY_MS)
}

export function getItemStatus(item: PantryItem): ItemStatus {
  const iso = getEffectiveExpirationISO(item)
  if (!iso) return 'sin-fecha'
  const days = daysUntil(iso)!
  if (days < 0) return 'caducado'
  if (days <= 1) return 'urgente'
  if (days <= 3) return 'proximo'
  return 'ok'
}

export const STATUS_ORDER: ItemStatus[] = ['caducado', 'urgente', 'proximo', 'ok', 'sin-fecha']

export const STATUS_LABELS: Record<ItemStatus, string> = {
  caducado: 'Caducado',
  urgente: 'Caduca hoy/mañana',
  proximo: 'Caduca pronto',
  ok: 'En buen estado',
  'sin-fecha': 'Sin fecha estimada',
}

export const STATUS_COLORS: Record<ItemStatus, { bg: string; text: string; dot: string }> = {
  caducado: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  urgente: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  proximo: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  ok: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'sin-fecha': { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
}

export function formatDaysLabel(days: number | undefined): string {
  if (days === undefined) return 'Sin fecha'
  if (days < 0) return `Caducó hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`
  if (days === 0) return 'Caduca hoy'
  if (days === 1) return 'Caduca mañana'
  return `Caduca en ${days} días`
}

export function formatDateHuman(iso: string | undefined): string {
  if (!iso) return '—'
  const date = parseISODateOnly(iso)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

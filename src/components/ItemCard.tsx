import { Link } from 'react-router-dom'
import type { PantryItem } from '../types'
import { CATEGORY_ICONS } from '../data/foodCatalog'
import { daysUntil, formatDaysLabel, getEffectiveExpirationISO, getItemStatus } from '../utils/dateUtils'
import { StatusBadge } from './StatusBadge'

export function ItemCard({ item }: { item: PantryItem }) {
  const status = getItemStatus(item)
  const iso = getEffectiveExpirationISO(item)
  const days = daysUntil(iso)

  return (
    <Link
      to={`/despensa/${item.id}`}
      className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm transition active:scale-[0.98]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
        {CATEGORY_ICONS[item.category]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-stone-900">{item.name}</p>
        <p className="truncate text-sm text-stone-500">
          {item.quantity} {item.unit} · {formatDaysLabel(days)}
        </p>
      </div>
      <StatusBadge status={status} compact />
    </Link>
  )
}

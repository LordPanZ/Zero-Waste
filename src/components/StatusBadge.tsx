import { STATUS_COLORS, STATUS_LABELS } from '../utils/dateUtils'
import type { ItemStatus } from '../types'

export function StatusBadge({ status, compact = false }: { status: ItemStatus; compact?: boolean }) {
  const c = STATUS_COLORS[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${c.bg} ${c.text} ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABELS[status]}
    </span>
  )
}

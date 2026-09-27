import { Flame, Leaf, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/Layout'
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../data/foodCatalog'
import { useWasteLog } from '../hooks/usePantry'
import type { FoodCategory } from '../types'
import { computeWasteStats } from '../utils/stats'

export function Stats() {
  const wasteLog = useWasteLog()
  const stats = computeWasteStats(wasteLog)

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title="Tu progreso" subtitle="Cada alimento aprovechado cuenta" />

      {stats.totalLogged === 0 ? (
        <div className="px-4">
          <EmptyState
            icon="📊"
            title="Aún no hay datos"
            description="Cuando marques alimentos como consumidos o desperdiciados, verás aquí tus estadísticas."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 px-4">
            <Stat icon={<Leaf size={18} />} value={`${stats.savedRate}%`} label="Aprovechado" tone="bg-emerald-50 text-emerald-700" />
            <Stat icon={<Flame size={18} />} value={stats.currentStreakDays} label="Días de racha" tone="bg-orange-50 text-orange-700" />
            <Stat icon={<Trash2 size={18} />} value={stats.wasted} label="Desperdiciados" tone="bg-red-50 text-red-700" />
          </div>

          <div className="mx-4 rounded-2xl bg-stone-50 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-stone-700">Consumidos vs. desperdiciados</span>
              <span className="text-stone-400">{stats.totalLogged} registros</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-stone-200">
              <div className="bg-emerald-500" style={{ width: `${stats.savedRate}%` }} />
              <div className="bg-red-400" style={{ width: `${100 - stats.savedRate}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-stone-500">
              <span>✓ {stats.consumed} consumidos</span>
              <span>✕ {stats.wasted} desperdiciados</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 px-4">
            <h2 className="text-sm font-semibold text-stone-800">Por categoría</h2>
            {stats.categoryBreakdown
              .sort((a, b) => b.consumed + b.wasted - (a.consumed + a.wasted))
              .map(({ category, consumed, wasted }) => {
                const total = consumed + wasted
                const pct = total === 0 ? 0 : Math.round((consumed / total) * 100)
                return (
                  <div key={category} className="flex items-center gap-3 rounded-xl border border-stone-100 p-3">
                    <span className="text-xl">{CATEGORY_ICONS[category as FoodCategory]}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-stone-700">{CATEGORY_LABELS[category as FoodCategory]}</span>
                        <span className="text-xs text-stone-400">{pct}% aprovechado</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ icon, value, label, tone }: { icon: ReactNode; value: string | number; label: string; tone: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center ${tone}`}>
      {icon}
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  )
}

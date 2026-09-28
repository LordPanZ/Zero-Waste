import { ChefHat, Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ItemCard } from '../components/ItemCard'
import { PageHeader } from '../components/Layout'
import { ProfilesShowcase } from '../components/ProfilesShowcase'
import { useSortedPantryItems, useWasteLog } from '../hooks/usePantry'
import { getItemStatus } from '../utils/dateUtils'
import { computeWasteStats } from '../utils/stats'

export function Home() {
  const items = useSortedPantryItems()
  const wasteLog = useWasteLog()
  const stats = computeWasteStats(wasteLog)

  const expired = items.filter((i) => getItemStatus(i) === 'caducado')
  const urgent = items.filter((i) => getItemStatus(i) === 'urgente')
  const soon = items.filter((i) => getItemStatus(i) === 'proximo')
  const attention = [...expired, ...urgent, ...soon].slice(0, 6)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="flex flex-col gap-5 pb-6">
      <PageHeader title={`${greeting} 👋`} subtitle="Esto es lo que necesita tu atención hoy" />

      <ProfilesShowcase />

      <div className="grid grid-cols-3 gap-2 px-4">
        <SummaryStat label="Caducados" value={expired.length} tone="bg-red-50 text-red-700" />
        <SummaryStat label="Urgentes" value={urgent.length} tone="bg-orange-50 text-orange-700" />
        <SummaryStat label="Próximos" value={soon.length} tone="bg-amber-50 text-amber-700" />
      </div>

      {stats.currentStreakDays >= 2 && (
        <div className="mx-4 flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-medium text-white">
          <Sparkles size={18} />
          Llevas {stats.currentStreakDays} días seguidos sin desperdiciar comida. ¡Sigue así!
        </div>
      )}

      <section className="flex flex-col gap-2 px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-stone-800">Necesitan atención</h2>
          <Link to="/despensa" className="text-sm font-medium text-brand-700">
            Ver despensa
          </Link>
        </div>

        {attention.length === 0 ? (
          <EmptyState
            icon="✨"
            title="¡Todo bajo control!"
            description="No tienes alimentos caducados ni a punto de caducar."
            action={
              <Link
                to="/despensa/nuevo"
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white"
              >
                <Plus size={16} /> Añadir alimento
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {attention.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {attention.length > 0 && (
        <div className="px-4">
          <Link
            to="/recetas"
            className="flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800"
          >
            <span className="flex items-center gap-2">
              <ChefHat size={18} /> Ver recetas para aprovecharlos
            </span>
            <span>→</span>
          </Link>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-20 mx-auto flex max-w-[480px] justify-end px-4">
        <Link
          to="/despensa/nuevo"
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30"
        >
          <Plus size={18} /> Añadir
        </Link>
      </div>
    </div>
  )
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-2xl px-3 py-3 text-center ${tone}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  )
}

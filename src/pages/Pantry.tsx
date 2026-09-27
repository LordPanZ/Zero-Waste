import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ItemCard } from '../components/ItemCard'
import { PageHeader } from '../components/Layout'
import { CATEGORY_ICONS, CATEGORY_LABELS, STORAGE_LABELS } from '../data/foodCatalog'
import { useSortedPantryItems } from '../hooks/usePantry'
import type { FoodCategory, ItemStatus, StorageLocation } from '../types'
import { getItemStatus, STATUS_LABELS } from '../utils/dateUtils'

const STORAGE_FILTERS: StorageLocation[] = ['nevera', 'despensa', 'congelador']
const STATUS_FILTERS: ItemStatus[] = ['caducado', 'urgente', 'proximo', 'ok', 'sin-fecha']

export function Pantry() {
  const items = useSortedPantryItems()
  const [query, setQuery] = useState('')
  const [storageFilter, setStorageFilter] = useState<StorageLocation | 'todas'>('todas')
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'todos'>('todos')

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (query && !item.name.toLowerCase().includes(query.toLowerCase())) return false
      if (storageFilter !== 'todas' && item.storage !== storageFilter) return false
      if (statusFilter !== 'todos' && getItemStatus(item) !== statusFilter) return false
      return true
    })
  }, [items, query, storageFilter, statusFilter])

  const grouped = useMemo(() => {
    const map = new Map<FoodCategory, typeof filtered>()
    for (const item of filtered) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Mi despensa"
        subtitle={`${items.length} alimento${items.length === 1 ? '' : 's'} guardados`}
        right={
          <Link
            to="/despensa/nuevo"
            className="flex items-center gap-1 rounded-full bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Añadir
          </Link>
        }
      />

      <div className="px-4">
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
          <Search size={16} className="text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alimento…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
        <FilterChip label="Todas" active={storageFilter === 'todas'} onClick={() => setStorageFilter('todas')} />
        {STORAGE_FILTERS.map((s) => (
          <FilterChip key={s} label={STORAGE_LABELS[s]} active={storageFilter === s} onClick={() => setStorageFilter(s)} />
        ))}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
        <FilterChip label="Todos los estados" active={statusFilter === 'todos'} onClick={() => setStatusFilter('todos')} />
        {STATUS_FILTERS.map((s) => (
          <FilterChip key={s} label={STATUS_LABELS[s]} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
        ))}
      </div>

      <div className="flex flex-col gap-5 px-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon="🧺"
            title={items.length === 0 ? 'Tu despensa está vacía' : 'Sin resultados'}
            description={
              items.length === 0
                ? 'Añade tu primer alimento para empezar a controlar caducidades.'
                : 'Prueba a cambiar los filtros o la búsqueda.'
            }
            action={
              items.length === 0 ? (
                <Link
                  to="/despensa/nuevo"
                  className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                >
                  <Plus size={16} /> Añadir alimento
                </Link>
              ) : undefined
            }
          />
        ) : (
          grouped.map(([category, catItems]) => (
            <div key={category} className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-medium text-stone-500">
                <span>{CATEGORY_ICONS[category]}</span> {CATEGORY_LABELS[category]}
              </h3>
              <div className="flex flex-col gap-2">
                {catItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-600'
      }`}
    >
      {label}
    </button>
  )
}
